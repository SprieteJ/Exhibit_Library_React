"""
api/macro_sensitivity.py v4

"Is macro driving the crypto market?"

Simple, defensible approach:
- Compute 30-day daily rolling correlation of BTC vs DXY, VIX, SPY
- The macro sensitivity reading = average of the absolute correlations
- When multiple correlations are simultaneously elevated, crypto is entangled with macro
- When all are near zero, crypto trades independently

No z-scores, no sigmoid mapping, no made-up thresholds. Just the raw correlations
and their average magnitude, with historical context.
"""
import math
from api.shared import get_conn
import psycopg2.extras


FACTORS = {
    'DXY': {'ticker': 'DX-Y.NYB', 'table': 'macro_daily', 'col': 'ticker', 'val': 'close',
            'label': 'US Dollar (DXY)', 'method': 'log'},
    'VIX': {'ticker': '^VIX', 'table': 'macro_daily', 'col': 'ticker', 'val': 'close',
            'label': 'Volatility (VIX)', 'method': 'log'},
    'SPY': {'ticker': 'SPY', 'table': 'macro_daily', 'col': 'ticker', 'val': 'close',
            'label': 'Equities (SPY)', 'method': 'log'},
}


def _fetch_series(cur, table, col, ticker, val_col, start_date):
    cur.execute(f"""
        SELECT timestamp::date as date, {val_col} FROM {table}
        WHERE {col} = %s AND {val_col} > 0 AND timestamp >= %s
        ORDER BY timestamp
    """, (ticker, start_date))
    return {str(r['date']): float(r[val_col]) for r in cur.fetchall()}


def _forward_fill(raw, all_dates):
    filled = {}
    last = None
    for d in all_dates:
        v = raw.get(d)
        if v is not None:
            last = v
        if last is not None:
            filled[d] = last
    return filled


def _log_returns(prices, dates):
    rets = {}
    prev = None
    for d in dates:
        p = prices.get(d)
        if p and prev and prev > 0:
            rets[d] = math.log(p / prev)
        prev = p if p else prev
    return rets


def _rolling_corr(rets_a, rets_b, dates, window):
    """Returns list of (date, correlation_or_None)."""
    results = []
    for i in range(len(dates)):
        if i < window:
            results.append((dates[i], None))
            continue
        pairs = []
        for j in range(i - window, i):
            d = dates[j]
            a, b = rets_a.get(d), rets_b.get(d)
            if a is not None and b is not None:
                pairs.append((a, b))
        if len(pairs) < window * 0.5:
            results.append((dates[i], None))
            continue
        ax = [p[0] for p in pairs]
        bx = [p[1] for p in pairs]
        n = len(pairs)
        ma = sum(ax) / n
        mb = sum(bx) / n
        num = sum((ax[k] - ma) * (bx[k] - mb) for k in range(n))
        da = math.sqrt(sum((a - ma) ** 2 for a in ax))
        db = math.sqrt(sum((b - mb) ** 2 for b in bx))
        corr = (num / (da * db)) if da > 0 and db > 0 else 0.0
        results.append((dates[i], round(corr, 4)))
    return results


def handle_macro_sensitivity(params):
    date_from = params.get("from", ["2018-01-01"])[0]
    date_to = params.get("to", ["2099-01-01"])[0]
    window = int(params.get("window", ["30"])[0])

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Fetch BTC
    btc = _fetch_series(cur, 'price_daily', 'symbol', 'BTC', 'price_usd', date_from)

    # Fetch factors
    factor_data = {}
    for name, f in FACTORS.items():
        factor_data[name] = _fetch_series(cur, f['table'], f['col'], f['ticker'], f['val'], date_from)

    conn.close()

    if not btc:
        return {"error": "no BTC data"}

    # Build common dates (BTC dates as base)
    all_dates = sorted(btc.keys())

    # Forward-fill factors over weekends
    for name in FACTORS:
        factor_data[name] = _forward_fill(factor_data[name], all_dates)

    # Compute log returns
    btc_rets = _log_returns(btc, all_dates)
    factor_rets = {}
    for name in FACTORS:
        factor_rets[name] = _log_returns(factor_data[name], all_dates)

    # Rolling correlations
    corr_series = {}
    for name in FACTORS:
        corr_series[name] = _rolling_corr(btc_rets, factor_rets[name], all_dates, window)

    # Build output
    out_dates = []
    out_components = {name: [] for name in FACTORS}
    out_abs_avg = []

    for i, d in enumerate(all_dates):
        if d < date_from:
            continue

        vals = {}
        skip = False
        for name in FACTORS:
            _, c = corr_series[name][i]
            if c is None:
                skip = True
                break
            vals[name] = c

        if skip:
            continue

        out_dates.append(d)
        for name in FACTORS:
            out_components[name].append(vals[name])

        abs_avg = sum(abs(v) for v in vals.values()) / len(vals)
        out_abs_avg.append(round(abs_avg, 4))

    # Historical percentile of current abs_avg
    current = {}
    if out_dates:
        latest_abs = out_abs_avg[-1]
        below = sum(1 for v in out_abs_avg if v <= latest_abs)
        percentile = round(100 * below / len(out_abs_avg), 1)

        current['abs_avg'] = latest_abs
        current['percentile'] = percentile
        for name in FACTORS:
            current[name] = {
                'corr': out_components[name][-1],
                'label': FACTORS[name]['label'],
            }

    return {
        "dates": out_dates,
        "abs_avg": out_abs_avg,
        "components": {
            name: {
                "label": FACTORS[name]['label'],
                "corr": out_components[name],
            }
            for name in FACTORS
        },
        "current": current,
        "window": window,
    }
