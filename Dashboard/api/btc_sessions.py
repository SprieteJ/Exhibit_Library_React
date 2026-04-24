"""
api/bitcoin.py addition — BTC Cumulative Return By Session

Splits BTC hourly price data into 3 trading sessions:
  APAC: 00:00-08:00 UTC
  EU:   08:00-16:00 UTC
  US:   16:00-00:00 UTC

For each session on each day, computes the return (close/open - 1).
Then accumulates returns per session over the date range.
"""
from api.shared import get_conn
import psycopg2.extras


def handle_btc_session_returns(params):
    date_from = params.get("from", ["2026-03-01"])[0]
    date_to = params.get("to", ["2099-01-01"])[0]

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT timestamp, price_usd FROM price_hourly
        WHERE symbol = 'BTC' AND price_usd > 0
          AND timestamp >= %s AND timestamp <= %s
        ORDER BY timestamp
    """, (date_from, date_to + ' 23:59:59'))
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {"error": "no data", "dates": [], "us": [], "eu": [], "apac": []}

    # Group prices by date and session
    # For each hour, assign to a session
    from collections import defaultdict
    # Key: (date_str, session) -> list of prices in order
    session_prices = defaultdict(list)

    for r in rows:
        ts = r['timestamp']
        hour = ts.hour
        price = float(r['price_usd'])

        if hour < 8:
            session = 'apac'
            day = ts.strftime('%Y-%m-%d')
        elif hour < 16:
            session = 'eu'
            day = ts.strftime('%Y-%m-%d')
        else:
            session = 'us'
            day = ts.strftime('%Y-%m-%d')

        session_prices[(day, session)].append(price)

    # Get all unique dates sorted
    all_dates = sorted(set(d for d, s in session_prices.keys()))

    # Compute session return for each day: (last price / first price) - 1
    sessions = ['apac', 'eu', 'us']
    daily_returns = {s: {} for s in sessions}

    for (day, session), prices in session_prices.items():
        if len(prices) >= 2:
            ret = (prices[-1] / prices[0]) - 1
        else:
            ret = 0
        daily_returns[session][day] = ret

    # Build cumulative return series
    # Start from 0, accumulate each session's daily return
    out_timestamps = []  # one entry per session per day, in chronological order
    out_us = []
    out_eu = []
    out_apac = []

    cum = {'us': 0, 'eu': 0, 'apac': 0}
    # Order within each day: APAC first, then EU, then US
    session_order = ['apac', 'eu', 'us']

    for day in all_dates:
        for session in session_order:
            ret = daily_returns[session].get(day)
            if ret is not None:
                cum[session] += ret

            out_timestamps.append(day + ' ' + {'apac': '04:00', 'eu': '12:00', 'us': '20:00'}[session])
            out_us.append(round(cum['us'] * 100, 2))
            out_eu.append(round(cum['eu'] * 100, 2))
            out_apac.append(round(cum['apac'] * 100, 2))

    return {
        "dates": out_timestamps,
        "us": out_us,
        "eu": out_eu,
        "apac": out_apac,
        "summary": {
            "us": round(cum['us'] * 100, 2),
            "eu": round(cum['eu'] * 100, 2),
            "apac": round(cum['apac'] * 100, 2),
        }
    }
