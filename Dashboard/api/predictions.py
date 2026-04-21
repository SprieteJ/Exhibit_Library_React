"""
api/predictions.py — Prediction markets API.
Reads from pm_markets + pm_snapshots (populated by cron/pm_ingest.py).
Proxies CLOB price history for detailed charts.
"""
import json, urllib.request, urllib.error
from datetime import datetime, timedelta
from api.shared import get_conn
import psycopg2.extras


def _fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'WintermuteDashboard/1.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return None


def handle_pm_markets(params):
    """Discovery: active markets from DB, with latest snapshot data."""
    category = params.get('category', [None])[0]
    sort_by  = params.get('sort', ['volume_24h'])[0]  # volume_24h, probability, liquidity
    limit    = min(int(params.get('limit', ['100'])[0]), 200)
    search   = params.get('q', [None])[0]

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Get latest snapshot per market + market info
    where = ["m.active = TRUE"]
    args = []

    if category and category.lower() != 'all':
        where.append("m.category = %s")
        args.append(category)
    if search:
        where.append("m.question ILIKE %s")
        args.append(f'%{search}%')

    where_sql = ' AND '.join(where)

    # Sort mapping
    sort_col = {
        'volume_24h': 's.volume_24h', 'probability': 's.probability',
        'liquidity': 's.liquidity', 'volume_total': 's.volume_total',
    }.get(sort_by, 's.volume_24h')

    cur.execute(f"""
        SELECT m.market_id, m.question, m.slug, m.category, m.image_url,
               m.end_date, m.clob_token_id, m.outcomes, m.url,
               s.probability, s.volume_24h, s.volume_total, s.liquidity, s.timestamp as snap_time,
               EXISTS(SELECT 1 FROM pm_watchlist w WHERE w.market_id = m.market_id) as watchlisted
        FROM pm_markets m
        LEFT JOIN LATERAL (
            SELECT probability, volume_24h, volume_total, liquidity, timestamp
            FROM pm_snapshots WHERE market_id = m.market_id
            ORDER BY timestamp DESC LIMIT 1
        ) s ON TRUE
        WHERE {where_sql}
        ORDER BY {sort_col} DESC NULLS LAST
        LIMIT %s
    """, args + [limit])
    rows = cur.fetchall()
    conn.close()

    markets = []
    for r in rows:
        outcomes = r['outcomes'] if isinstance(r['outcomes'], list) else json.loads(r['outcomes'] or '[]')
        markets.append({
            'id':            r['market_id'],
            'question':      r['question'],
            'slug':          r['slug'],
            'category':      r['category'],
            'image':         r['image_url'],
            'end_date':      str(r['end_date']) if r['end_date'] else None,
            'clob_token_id': r['clob_token_id'],
            'outcomes':      outcomes,
            'url':           r['url'],
            'probability':   round(r['probability'] * 100, 1) if r['probability'] is not None else None,
            'volume_24h':    round(r['volume_24h'], 2) if r['volume_24h'] else 0,
            'volume_total':  round(r['volume_total'], 2) if r['volume_total'] else 0,
            'liquidity':     round(r['liquidity'], 2) if r['liquidity'] else 0,
            'snap_time':     r['snap_time'].strftime('%Y-%m-%d %H:%M UTC') if r['snap_time'] else None,
            'watchlisted':   r['watchlisted'],
        })

    return {'markets': markets, 'count': len(markets)}


def handle_pm_movers(params):
    """Markets with biggest probability change over last 24h from stored snapshots."""
    limit = min(int(params.get('limit', ['30'])[0]), 50)

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Compare latest snapshot vs ~24h ago
    cur.execute("""
        WITH latest AS (
            SELECT DISTINCT ON (market_id) market_id, probability, volume_24h, timestamp
            FROM pm_snapshots ORDER BY market_id, timestamp DESC
        ),
        old AS (
            SELECT DISTINCT ON (market_id) market_id, probability
            FROM pm_snapshots
            WHERE timestamp < NOW() - INTERVAL '20 hours'
            ORDER BY market_id, timestamp DESC
        )
        SELECT l.market_id, m.question, m.slug, m.category, m.image_url, m.clob_token_id,
               l.probability as prob_now, o.probability as prob_old, l.volume_24h,
               (l.probability - o.probability) * 100 as change_24h
        FROM latest l
        JOIN old o ON l.market_id = o.market_id
        JOIN pm_markets m ON m.market_id = l.market_id
        WHERE m.active = TRUE
          AND ABS(l.probability - o.probability) > 0.005
        ORDER BY ABS(l.probability - o.probability) DESC
        LIMIT %s
    """, (limit,))
    rows = cur.fetchall()
    conn.close()

    movers = [{
        'id':           r['market_id'],
        'question':     r['question'],
        'slug':         r['slug'],
        'category':     r['category'],
        'image':        r['image_url'],
        'probability':  round(r['prob_now'] * 100, 1) if r['prob_now'] else None,
        'change_24h':   round(r['change_24h'], 1) if r['change_24h'] else 0,
        'volume_24h':   round(r['volume_24h'], 2) if r['volume_24h'] else 0,
    } for r in rows]

    return {'movers': movers}


def handle_pm_history(params):
    """Probability history for a market. Uses DB snapshots + CLOB API for older data."""
    market_id  = params.get('market_id', [None])[0]
    token_id   = params.get('token_id', [None])[0]
    interval   = params.get('interval', ['max'])[0]
    fidelity   = params.get('fidelity', ['200'])[0]

    result = {'dates': [], 'probability': [], 'source': 'db'}

    # Try DB snapshots first
    if market_id:
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT timestamp, probability FROM pm_snapshots
            WHERE market_id = %s ORDER BY timestamp
        """, (market_id,))
        rows = cur.fetchall()
        conn.close()

        if rows:
            result['dates'] = [r['timestamp'].strftime('%Y-%m-%d %H:%M') for r in rows]
            result['probability'] = [round(r['probability'] * 100, 1) if r['probability'] else None for r in rows]

    # If we have a CLOB token ID, also fetch from CLOB API for longer history
    if token_id:
        url = f'https://clob.polymarket.com/prices-history?market={token_id}&interval={interval}&fidelity={fidelity}'
        data = _fetch_json(url)
        if data and data.get('history'):
            hist = data['history']
            clob_dates = [datetime.utcfromtimestamp(h['t']).strftime('%Y-%m-%d %H:%M') for h in hist]
            clob_probs = [round(h['p'] * 100, 1) for h in hist]

            # Merge: use CLOB for older data, DB for recent (DB has higher fidelity)
            if result['dates']:
                db_start = result['dates'][0]
                # Prepend CLOB data that's before our DB data
                prepend_dates = [d for d, p in zip(clob_dates, clob_probs) if d < db_start]
                prepend_probs = [p for d, p in zip(clob_dates, clob_probs) if d < db_start]
                result['dates'] = prepend_dates + result['dates']
                result['probability'] = prepend_probs + result['probability']
                result['source'] = 'merged'
            else:
                result['dates'] = clob_dates
                result['probability'] = clob_probs
                result['source'] = 'clob'

    return result


def handle_pm_watchlist(params):
    """Get watchlist with latest snapshot data."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    cur.execute("""
        SELECT m.market_id, m.question, m.slug, m.category, m.image_url,
               m.end_date, m.clob_token_id, m.outcomes, m.url, w.added_at,
               s.probability, s.volume_24h, s.volume_total, s.liquidity
        FROM pm_watchlist w
        JOIN pm_markets m ON m.market_id = w.market_id
        LEFT JOIN LATERAL (
            SELECT probability, volume_24h, volume_total, liquidity
            FROM pm_snapshots WHERE market_id = m.market_id
            ORDER BY timestamp DESC LIMIT 1
        ) s ON TRUE
        ORDER BY w.added_at DESC
    """)
    rows = cur.fetchall()
    conn.close()

    items = []
    for r in rows:
        outcomes = r['outcomes'] if isinstance(r['outcomes'], list) else json.loads(r['outcomes'] or '[]')
        items.append({
            'id':           r['market_id'],
            'question':     r['question'],
            'slug':         r['slug'],
            'category':     r['category'],
            'image':        r['image_url'],
            'end_date':     str(r['end_date']) if r['end_date'] else None,
            'clob_token_id': r['clob_token_id'],
            'outcomes':     outcomes,
            'url':          r['url'],
            'added_at':     r['added_at'].strftime('%Y-%m-%d') if r['added_at'] else None,
            'probability':  round(r['probability'] * 100, 1) if r['probability'] is not None else None,
            'volume_24h':   round(r['volume_24h'], 2) if r['volume_24h'] else 0,
            'volume_total': round(r['volume_total'], 2) if r['volume_total'] else 0,
            'liquidity':    round(r['liquidity'], 2) if r['liquidity'] else 0,
        })

    return {'watchlist': items}


def handle_pm_watchlist_add(params, body=None):
    """Add a market to watchlist. Expects market_id in params or POST body."""
    market_id = params.get('market_id', [None])[0]
    if not market_id:
        return {'error': 'market_id required'}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO pm_watchlist (market_id) VALUES (%s)
        ON CONFLICT (market_id) DO NOTHING
    """, (market_id,))
    conn.commit()
    conn.close()
    return {'ok': True, 'market_id': market_id}


def handle_pm_watchlist_remove(params):
    """Remove a market from watchlist."""
    market_id = params.get('market_id', [None])[0]
    if not market_id:
        return {'error': 'market_id required'}

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM pm_watchlist WHERE market_id = %s", (market_id,))
    conn.commit()
    conn.close()
    return {'ok': True, 'market_id': market_id}


def handle_pm_categories(params):
    """Return category breakdown with counts."""
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT category, COUNT(*) as count
        FROM pm_markets WHERE active = TRUE
        GROUP BY category ORDER BY count DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return {'categories': [{'name': r['category'], 'count': r['count']} for r in rows]}
