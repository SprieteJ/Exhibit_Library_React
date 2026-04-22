"""
api/macro_sensitivity.py — "Is macro driving the market?"

Computes hourly rolling correlation of BTC vs macro factors (DXY, 10Y yield),
z-scores against available history, and returns a 0-100 composite score.

Score interpretation:
  0-30:  Crypto independent — macro factors not driving
  30-60: Moderate — some macro influence
  60-100: Macro-driven — crypto moving with macro factors
"""
import math
from datetime import datetime, timedelta
from api.shared import get_conn
import psycopg2.extras


def handle_macro_sensitivity(params):
    window_hours = int(params.get("window", ["168"])[0])  # default 7 days = 168 hours

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Fetch all available hourly BTC
    cur.execute("""
        SELECT timestamp, price_usd FROM price_hourly
        WHERE symbol = 'BTC' AND price_usd > 0
        ORDER BY timestamp
    """)
    btc_rows = cur.fetchall()
    btc_map = {}
    for r in btc_rows:
        # Round to hour
        ts = r['timestamp'].replace(minute=0, second=0, microsecond=0)
        key = ts.strftime('%Y-%m-%d %H:00')
        btc_map[key] = float(r['price_usd'])

    # Fetch macro factors hourly
    factors = {
        'DXY': 'DX-Y.NYB',
        '10Y': '^TNX',
    }
    factor_maps = {}
    for label, ticker in factors.items():
        cur.execute("""
            SELECT timestamp, close FROM macro_hourly
            WHERE ticker = %s AND close > 0
            ORDER BY timestamp
        """, (ticker,))
        rows = cur.fetchall()
        fmap = {}
        for r in rows:
            ts = r['timestamp'].replace(minute=0, second=0, microsecond=0)
            key = ts.strftime('%Y-%m-%d %H:00')
            fmap[key] = float(r['close'])
        factor_maps[label] = fmap

    conn.close()

    if not btc_map:
        return {"error": "no BTC hourly data"}

    # Build common hourly timestamps (where BTC has data)
    all_hours = sorted(btc_map.keys())

    # Forward-fill macro factors (they don't trade every hour)
    for label in factor_maps:
        filled = {}
        last_val = None
        for h in all_hours:
            v = factor_maps[label].get(h)
            if v is not None:
                last_val = v
            if last_val is not None:
                filled[h] = last_val
        factor_maps[label] = filled

    # Compute hourly returns
    btc_rets = {}
    prev = None
    for h in all_hours:
        p = btc_map.get(h)
        if p and prev and prev > 0:
            btc_rets[h] = math.log(p / prev)
        prev = p if p else prev

    factor_rets = {}
    for label in factors:
        rets = {}
        prev = None
        for h in all_hours:
            v = factor_maps[label].get(h)
            if v is not None and prev is not None:
                if label == '10Y':
                    rets[h] = v - prev  # first difference for yields
                else:
                    if prev > 0:
                        rets[h] = math.log(v / prev)
            prev = v if v is not None else prev
        factor_rets[label] = rets

    # Rolling correlation function
    def compute_rolling_corr(rets_a, rets_b, hours, win):
        results = []  # (hour_key, corr)
        for i in range(len(hours)):
            h = hours[i]
            start = max(0, i - win + 1)
            pairs = []
            for j in range(start, i + 1):
                hh = hours[j]
                a = rets_a.get(hh)
                b = rets_b.get(hh)
                if a is not None and b is not None:
                    pairs.append((a, b))

            if len(pairs) < win * 0.5:
                results.append((h, None))
                continue

            ax = [p[0] for p in pairs]
            bx = [p[1] for p in pairs]
            n = len(pairs)
            ma = sum(ax) / n
            mb = sum(bx) / n
            num = sum((ax[k] - ma) * (bx[k] - mb) for k in range(n))
            da = math.sqrt(sum((a - ma)**2 for a in ax))
            db = math.sqrt(sum((b - mb)**2 for b in bx))
            corr = (num / (da * db)) if (da > 0 and db > 0) else 0.0
            results.append((h, round(corr, 4)))
        return results

    # Compute correlations for each factor
    component_corrs = {}
    for label in factors:
        component_corrs[label] = compute_rolling_corr(btc_rets, factor_rets[label], all_hours, window_hours)

    # Z-score each correlation against ALL available history
    def zscore_series(corr_list):
        vals = [c for _, c in corr_list if c is not None]
        if len(vals) < 20:
            return [(h, c, None) for h, c in corr_list]
        mean = sum(vals) / len(vals)
        std = math.sqrt(sum((v - mean)**2 for v in vals) / len(vals))
        if std == 0:
            return [(h, c, 0.0) for h, c in corr_list]
        result = []
        for h, c in corr_list:
            if c is None:
                result.append((h, None, None))
            else:
                z = round((c - mean) / std, 4)
                result.append((h, c, z))
        return result

    components = {}
    for label in factors:
        components[label] = zscore_series(component_corrs[label])

    # Build output — downsample to daily for the chart (take last hour of each day)
    daily_buckets = {}
    for i, h in enumerate(all_hours):
        day = h[:10]  # YYYY-MM-DD
        daily_buckets[day] = i  # last index for each day

    output_dates = []
    output_components = {label: {'corr': [], 'zscore': []} for label in factors}
    output_blend_abs_z = []
    output_score = []

    for day in sorted(daily_buckets.keys()):
        idx = daily_buckets[day]

        all_z = []
        skip = False
        for label in factors:
            _, corr, z = components[label][idx]
            if z is None:
                skip = True
                break
            all_z.append(z)

        if skip:
            continue

        output_dates.append(day)
        for label in factors:
            _, corr, z = components[label][idx]
            output_components[label]['corr'].append(corr)
            output_components[label]['zscore'].append(z)

        # Absolute blend z
        abs_z = sum(abs(z) for z in all_z) / len(all_z)
        output_blend_abs_z.append(round(abs_z, 4))

        # Convert |z| to 0-100 score using sigmoid-like mapping
        # |z| of 0 → score ~15 (baseline noise)
        # |z| of 1 → score ~50
        # |z| of 2 → score ~80
        # |z| of 3+ → score ~95
        score = round(100 * (1 - math.exp(-0.7 * abs_z)), 1)
        output_score.append(score)

    # Current values for summary
    current = {}
    if output_dates:
        current['score'] = output_score[-1]
        current['abs_z'] = output_blend_abs_z[-1]
        for label in factors:
            current[label] = {
                'corr': output_components[label]['corr'][-1],
                'zscore': output_components[label]['zscore'][-1],
            }

    return {
        "dates": output_dates,
        "score": output_score,
        "blend_abs_zscore": output_blend_abs_z,
        "components": {
            label: {
                "label": "US Dollar (DXY)" if label == "DXY" else "10Y Treasury Yield",
                "corr": output_components[label]['corr'],
                "zscore": output_components[label]['zscore'],
            }
            for label in factors
        },
        "current": current,
        "window_hours": window_hours,
    }
