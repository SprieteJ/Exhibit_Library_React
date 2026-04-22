"""
Macro sensitivity: is crypto macro-driven right now?

For each factor (DXY, 10Y yield), compute:
  1. Rolling N-day correlation of BTC log returns vs factor log returns
  2. Z-score that correlation against its trailing 1-year distribution

The blended z-score = average of the two component z-scores.
High positive z = unusually high positive correlation to macro (macro driving crypto up with risk-on)
High negative z = unusually high negative correlation (macro driving crypto inversely)
High |z| either way = macro is driving. Near zero = crypto is independent.
"""
import math
from datetime import datetime, timedelta
from api.shared import get_conn
import psycopg2.extras


def handle_macro_sensitivity(params):
    date_from = params.get("from", ["2020-01-01"])[0]
    date_to   = params.get("to",   ["2099-01-01"])[0]
    window    = int(params.get("window", ["30"])[0])       # correlation window
    z_trail   = int(params.get("z_trail", ["365"])[0])     # z-score lookback

    # Need extra history: window for correlation warmup + z_trail for z-score warmup
    try:
        ext = (datetime.strptime(date_from, "%Y-%m-%d") - timedelta(days=window + z_trail + 30)).strftime("%Y-%m-%d")
    except:
        ext = "2015-01-01"

    conn = get_conn()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Fetch BTC daily prices
    cur.execute("""
        SELECT timestamp::date as date, price_usd FROM price_daily
        WHERE symbol = 'BTC' AND timestamp >= %s AND timestamp <= %s AND price_usd > 0
        ORDER BY timestamp
    """, (ext, date_to))
    btc_map = {str(r['date']): float(r['price_usd']) for r in cur.fetchall()}

    # Fetch macro factors
    factors = {
        'DXY': 'DX-Y.NYB',
        '10Y': '^TNX',
    }
    factor_maps = {}
    for label, ticker in factors.items():
        cur.execute("""
            SELECT timestamp::date as date, close FROM macro_daily
            WHERE ticker = %s AND timestamp >= %s AND timestamp <= %s AND close > 0
            ORDER BY timestamp
        """, (ticker, ext, date_to))
        factor_maps[label] = {str(r['date']): float(r['close']) for r in cur.fetchall()}

    conn.close()

    if not btc_map:
        return {"error": "no BTC data"}

    # Use BTC dates as master (crypto trades every day)
    all_dates = sorted(btc_map.keys())

    # Forward-fill macro factors across weekends/holidays
    for label in factor_maps:
        filled = {}
        last_val = None
        for d in all_dates:
            v = factor_maps[label].get(d)
            if v is not None:
                last_val = v
            if last_val is not None:
                filled[d] = last_val
        factor_maps[label] = filled

    # Compute log returns for BTC
    btc_rets = {}
    prev = None
    for d in all_dates:
        p = btc_map.get(d)
        if p and prev and prev > 0:
            btc_rets[d] = math.log(p / prev)
        prev = p if p else prev

    # Compute log returns for each factor
    # Note: for 10Y yield (^TNX), use first differences not log returns
    # because yields can be near zero and log doesn't make sense
    factor_rets = {}
    for label in factor_maps:
        rets = {}
        prev = None
        for d in all_dates:
            v = factor_maps[label].get(d)
            if v is not None and prev is not None:
                if label == '10Y':
                    # First difference for yields (change in yield level)
                    rets[d] = v - prev
                else:
                    # Log return for price-based (DXY)
                    if prev > 0:
                        rets[d] = math.log(v / prev)
            prev = v if v is not None else prev
        factor_rets[label] = rets

    # Compute rolling correlation for each factor
    def rolling_corr_series(rets_a, rets_b, dates, win):
        """Returns list of (date, correlation) tuples."""
        result = []
        for i in range(len(dates)):
            d = dates[i]
            # Gather window of paired returns
            start_idx = max(0, i - win + 1)
            pairs = []
            for j in range(start_idx, i + 1):
                dd = dates[j]
                a = rets_a.get(dd)
                b = rets_b.get(dd)
                if a is not None and b is not None:
                    pairs.append((a, b))

            if len(pairs) < win * 0.7:  # need at least 70% of window
                result.append((d, None))
                continue

            ax = [p[0] for p in pairs]
            bx = [p[1] for p in pairs]
            n = len(pairs)
            ma = sum(ax) / n
            mb = sum(bx) / n
            num = sum((ax[k] - ma) * (bx[k] - mb) for k in range(n))
            da = math.sqrt(sum((a - ma)**2 for a in ax))
            db = math.sqrt(sum((b - mb)**2 for b in bx))

            if da > 0 and db > 0:
                corr = num / (da * db)
            else:
                corr = 0.0

            result.append((d, round(corr, 4)))
        return result

    # Compute correlations
    component_series = {}
    for label in factors:
        corr_series = rolling_corr_series(btc_rets, factor_rets[label], all_dates, window)
        component_series[label] = corr_series

    # Z-score each correlation against its trailing z_trail-day distribution
    def zscore_series(corr_series, trail):
        result = []
        corr_vals = [c for _, c in corr_series]
        for i, (d, c) in enumerate(corr_series):
            if c is None:
                result.append((d, None, None))
                continue
            # Gather trailing window of correlation values
            start = max(0, i - trail)
            trailing = [corr_vals[j] for j in range(start, i) if corr_vals[j] is not None]
            if len(trailing) < trail * 0.5:  # need at least 50% of lookback
                result.append((d, c, None))
                continue
            mean = sum(trailing) / len(trailing)
            std = math.sqrt(sum((v - mean)**2 for v in trailing) / len(trailing))
            if std > 0:
                z = (c - mean) / std
            else:
                z = 0.0
            result.append((d, c, round(z, 4)))
        return result

    components = {}
    for label in factors:
        zs = zscore_series(component_series[label], z_trail)
        components[label] = zs

    # Trim to requested date range and build output
    result_dates = []
    result_components = {label: {'corr': [], 'zscore': []} for label in factors}
    result_blend_z = []
    result_blend_abs_z = []

    for i, d in enumerate(all_dates):
        if d < date_from:
            continue

        all_z = []
        all_abs_z = []
        skip = False
        for label in factors:
            _, corr, z = components[label][i]
            if z is None:
                skip = True
                break
            all_z.append(z)
            all_abs_z.append(abs(z))

        if skip:
            continue

        result_dates.append(d)
        for label in factors:
            _, corr, z = components[label][i]
            result_components[label]['corr'].append(corr)
            result_components[label]['zscore'].append(z)

        # Blended z-score: average of component z-scores (preserves direction)
        result_blend_z.append(round(sum(all_z) / len(all_z), 4))
        # Absolute blend: average of |z| (measures magnitude regardless of direction)
        result_blend_abs_z.append(round(sum(all_abs_z) / len(all_abs_z), 4))

    return {
        "dates": result_dates,
        "components": {
            label: {
                "label": "US Dollar (DXY)" if label == "DXY" else "10Y Treasury Yield",
                "corr": result_components[label]['corr'],
                "zscore": result_components[label]['zscore'],
            }
            for label in factors
        },
        "blend_zscore": result_blend_z,
        "blend_abs_zscore": result_blend_abs_z,
        "window": window,
        "z_trail": z_trail,
    }
