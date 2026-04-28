"""
api/btc_rsi.py — BTC Price with RSI indicator.
Returns price, RSI values, and segment colors based on RSI direction.
"""
from api.shared import get_conn
import psycopg2.extras


def handle_btc_rsi(params):
    date_from = params.get("from", ["2020-01-01"])[0]
    date_to = params.get("to", ["2099-01-01"])[0]
    period = int(params.get("period", ["7"])[0])

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Need extra days before date_from for RSI warmup
    cur.execute("""
        SELECT timestamp::date as date, price_usd
        FROM price_daily
        WHERE symbol = 'BTC' AND price_usd > 0
        ORDER BY timestamp
    """)
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return {"error": "no data"}

    all_dates = [str(r['date']) for r in rows]
    all_prices = [float(r['price_usd']) for r in rows]

    # Compute RSI
    rsi_values = [None] * len(all_prices)
    for i in range(period, len(all_prices)):
        gains, losses = 0, 0
        for j in range(i - period + 1, i + 1):
            change = all_prices[j] - all_prices[j - 1]
            if change > 0:
                gains += change
            else:
                losses -= change
        avg_gain = gains / period
        avg_loss = losses / period
        if avg_loss == 0:
            rsi_values[i] = 100.0
        else:
            rs = avg_gain / avg_loss
            rsi_values[i] = round(100 - (100 / (1 + rs)), 2)

    # Trim to requested range
    out_dates, out_prices, out_rsi = [], [], []
    for i, d in enumerate(all_dates):
        if d < date_from or d > date_to:
            continue
        out_dates.append(d)
        out_prices.append(all_prices[i])
        out_rsi.append(rsi_values[i])

    # Determine if RSI is rising or falling at each point
    # green when RSI today < RSI yesterday (cooling), red when RSI today > RSI yesterday (heating)
    rsi_direction = [None]  # first point has no direction
    for i in range(1, len(out_rsi)):
        if out_rsi[i] is not None and out_rsi[i - 1] is not None:
            rsi_direction.append('green' if out_rsi[i] <= out_rsi[i - 1] else 'red')
        else:
            rsi_direction.append(None)

    return {
        "dates": out_dates,
        "price": out_prices,
        "rsi": out_rsi,
        "rsi_direction": rsi_direction,
        "period": period,
    }
