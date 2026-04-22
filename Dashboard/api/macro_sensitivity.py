"""
api/macro_sensitivity.py v3 — "Is macro driving the market?"

Current signal: hourly rolling correlation (7-day window) of BTC vs DXY and 10Y yield.
Z-score baseline: daily rolling correlation computed over full history (back to 2013).

This way a 0.5 correlation today is properly flagged as "high" because the daily
history includes periods where BTC was completely independent (2017, 2019, 2021).
"""
import math
from datetime import datetime, timedelta
from api.shared import get_conn
import psycopg2.extras


def _rolling_corr(rets_a, rets_b, keys, win):
    """Compute rolling Pearson correlation over paired return series."""
    results = []
    for i in range(len(keys)):
        start = max(0, i - win + 1)
        pairs = []
        for j in range(start, i + 1):
            k = keys[j]
            a = rets_a.get(k)
            b = rets_b.get(k)
            if a is not None and b is not None:
                pairs.append((a, b))
        if len(pairs) < win * 0.5:
            results.append(None)
            continue
        ax = [p[0] for p in pairs]
        bx = [p[1] for p in pairs]
        n = len(pairs)
        ma = sum(ax) / n
        mb = sum(bx) / n
        num = sum((ax[k2] - ma) * (bx[k2] - mb) for k2 in range(n))
        da = math.sqrt(sum((a - ma)**2 for a in ax))
        db = math.sqrt(sum((b - mb)**2 for b in bx))
        corr = (num / (da * db)) if (da > 0 and db > 0) else 0.0
        results.append(round(corr, 4))
    return results


def _log_returns(price_map, keys):
    rets = {}
    prev = None
    for k in keys:
        p = price_map.get(k)
        if p and prev and prev > 0:
            rets[k] = math.log(p / prev)
        prev = p if p else prev
    return rets


def _first_diffs(val_map, keys):
    rets = {}
    prev = None
    for k in keys:
        v = val_map.get(k)
        if v is not None and prev is not None:
            rets[k] = v - prev
        prev = v if v is not None else prev
    return rets


def _forward_fill(raw_map, all_keys):
    filled = {}
    last = None
    for k in all_keys:
        v = raw_map.get(k)
        if v is not None:
            last = v
        if last is not None:
            filled[k] = last
    return filled


def handle_macro_sensitivity(params):
    window_hours = int(params.get("window", ["168"])[0])  # 7 days default
    daily_window = 30  # 30-day window for daily correlation baseline

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    factors = {
        'DXY': {'ticker': 'DX-Y.NYB', 'method': 'log', 'label': 'US Dollar (DXY)'},
        '10Y': {'ticker': '^TNX', 'method': 'diff', 'label': '10Y Treasury Yield'},
    }

    # ══════════════════════════════════════════════════════════════════════
    # PART 1: Daily correlation history (z-score baseline, back to 2013+)
    # ══════════════════════════════════════════════════════════════════════

    cur.execute("""
        SELECT timestamp::date as date, price_usd FROM price_daily
        WHERE symbol = 'BTC' AND price_usd > 0 ORDER BY timestamp
    """)
    btc_daily = {str(r['date']): float(r['price_usd']) for r in cur.fetchall()}

    factor_daily = {}
    for label, f in factors.items():
        cur.execute("""
            SELECT timestamp::date as date, close FROM macro_daily
            WHERE ticker = %s AND close > 0 ORDER BY timestamp
        """, (f['ticker'],))
        factor_daily[label] = {str(r['date']): float(r['close']) for r in cur.fetchall()}

    daily_dates = sorted(btc_daily.keys())

    # Forward-fill macro over weekends
    for label in factors:
        factor_daily[label] = _forward_fill(factor_daily[label], daily_dates)

    # Daily returns
    btc_daily_rets = _log_returns(btc_daily, daily_dates)
    factor_daily_rets = {}
    for label, f in factors.items():
        if f['method'] == 'log':
            factor_daily_rets[label] = _log_returns(factor_daily[label], daily_dates)
        else:
            factor_daily_rets[label] = _first_diffs(factor_daily[label], daily_dates)

    # Daily rolling correlations
    daily_corr_history = {}
    for label in factors:
        daily_corr_history[label] = _rolling_corr(
            btc_daily_rets, factor_daily_rets[label], daily_dates, daily_window
        )

    # Compute mean and std of daily correlations (excluding None, full history)
    daily_stats = {}
    for label in factors:
        vals = [c for c in daily_corr_history[label] if c is not None]
        if len(vals) < 50:
            daily_stats[label] = {'mean': 0, 'std': 1}
            continue
        mean = sum(vals) / len(vals)
        std = math.sqrt(sum((v - mean)**2 for v in vals) / len(vals))
        daily_stats[label] = {'mean': mean, 'std': max(std, 0.01)}

    # ══════════════════════════════════════════════════════════════════════
    # PART 2: Hourly correlation (current signal)
    # ══════════════════════════════════════════════════════════════════════

    cur.execute("""
        SELECT timestamp, price_usd FROM price_hourly
        WHERE symbol = 'BTC' AND price_usd > 0 ORDER BY timestamp
    """)
    btc_hourly = {}
    for r in cur.fetchall():
        ts = r['timestamp'].replace(minute=0, second=0, microsecond=0)
        btc_hourly[ts.strftime('%Y-%m-%d %H:00')] = float(r['price_usd'])

    factor_hourly = {}
    for label, f in factors.items():
        cur.execute("""
            SELECT timestamp, close FROM macro_hourly
            WHERE ticker = %s AND close > 0 ORDER BY timestamp
        """, (f['ticker'],))
        fmap = {}
        for r in cur.fetchall():
            ts = r['timestamp'].replace(minute=0, second=0, microsecond=0)
            fmap[ts.strftime('%Y-%m-%d %H:00')] = float(r['close'])
        factor_hourly[label] = fmap

    conn.close()

    all_hours = sorted(btc_hourly.keys())

    # Forward-fill macro hourly
    for label in factors:
        factor_hourly[label] = _forward_fill(factor_hourly[label], all_hours)

    # Hourly returns
    btc_h_rets = _log_returns(btc_hourly, all_hours)
    factor_h_rets = {}
    for label, f in factors.items():
        if f['method'] == 'log':
            factor_h_rets[label] = _log_returns(factor_hourly[label], all_hours)
        else:
            factor_h_rets[label] = _first_diffs(factor_hourly[label], all_hours)

    # Hourly rolling correlations
    hourly_corrs = {}
    for label in factors:
        hourly_corrs[label] = _rolling_corr(
            btc_h_rets, factor_h_rets[label], all_hours, window_hours
        )

    # ══════════════════════════════════════════════════════════════════════
    # PART 3: Z-score hourly correlations against daily baseline
    # ══════════════════════════════════════════════════════════════════════

    # Downsample to daily (last hour of each day)
    daily_buckets = {}
    for i, h in enumerate(all_hours):
        day = h[:10]
        daily_buckets[day] = i

    output_dates = []
    output_components = {label: {'corr': [], 'zscore': []} for label in factors}
    output_score = []

    for day in sorted(daily_buckets.keys()):
        idx = daily_buckets[day]
        all_z = []
        skip = False

        for label in factors:
            corr = hourly_corrs[label][idx]
            if corr is None:
                skip = True
                break
            # Z-score against daily historical distribution
            z = (corr - daily_stats[label]['mean']) / daily_stats[label]['std']
            all_z.append(round(z, 4))

        if skip:
            continue

        output_dates.append(day)
        for j, label in enumerate(factors):
            corr = hourly_corrs[label][idx]
            output_components[label]['corr'].append(corr)
            output_components[label]['zscore'].append(all_z[j])

        # Score: average |z| mapped to 0-100 via sigmoid
        abs_z = sum(abs(z) for z in all_z) / len(all_z)
        score = round(100 * (1 - math.exp(-0.7 * abs_z)), 1)
        output_score.append(score)

    # Current values
    current = {}
    if output_dates:
        current['score'] = output_score[-1]
        for j, label in enumerate(factors):
            current[label] = {
                'corr': output_components[label]['corr'][-1],
                'zscore': output_components[label]['zscore'][-1],
            }

    # Also return daily correlation history for the chart
    daily_chart_dates = []
    daily_chart_corrs = {label: [] for label in factors}
    for i, d in enumerate(daily_dates):
        if d < '2020-01-01':
            continue
        skip2 = False
        for label in factors:
            if daily_corr_history[label][i] is None:
                skip2 = True
                break
        if skip2:
            continue
        daily_chart_dates.append(d)
        for label in factors:
            daily_chart_corrs[label].append(daily_corr_history[label][i])

    return {
        "dates": output_dates,
        "score": output_score,
        "components": {
            label: {
                "label": factors[label]['label'],
                "corr": output_components[label]['corr'],
                "zscore": output_components[label]['zscore'],
            }
            for label in factors
        },
        "current": current,
        "window_hours": window_hours,
        "daily_baseline": {
            "dates": daily_chart_dates,
            "components": {
                label: {
                    "corr": daily_chart_corrs[label],
                    "mean": round(daily_stats[label]['mean'], 4),
                    "std": round(daily_stats[label]['std'], 4),
                }
                for label in factors
            },
        },
    }
