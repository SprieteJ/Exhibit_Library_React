#!/usr/bin/env python3
"""
cron/pm_ingest.py — Polymarket prediction market ingestion.
Run every 15 minutes via cron or manual trigger.
Stores markets + probability snapshots in Postgres.

Tables:
  pm_markets   — market registry (upserted on each run)
  pm_snapshots — timestamped probability + volume snapshots
  pm_watchlist — user watchlist (managed via API, not this script)
"""
import os, json, urllib.request, urllib.error, sys
from datetime import datetime
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("[pm_ingest] ERROR: DATABASE_URL not set")
    sys.exit(1)

# ── Category classification ──────────────────────────────────────────────────

CATEGORY_RULES = [
    ('Crypto',        ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'defi', 'token', 'solana', 'altcoin', 'stablecoin', 'nft']),
    ('Politics',      ['president', 'election', 'trump', 'democrat', 'republican', 'vote', 'governor', 'senator', 'congress', 'nominee', 'primary', 'impeach']),
    ('Geopolitical',  ['war', 'ceasefire', 'iran', 'ukraine', 'russia', 'conflict', 'sanctions', 'military', 'nato', 'china', 'taiwan', 'nuclear', 'missile', 'strait', 'kharg']),
    ('Economics',     ['fed ', 'interest rate', 'inflation', 'gdp', 'recession', 'tariff', 'unemployment', 'cpi', 'fomc', 'rate cut', 'rate hike', 'treasury']),
    ('Sports',        ['fifa', 'nba', 'nfl', 'nhl', 'mlb', 'dota', 'league', 'championship', 'world cup', 'premier league', 'ufc', 'boxing', 'tennis', 'formula 1', 'f1 ']),
    ('Entertainment', ['oscar', 'grammy', 'emmy', 'movie', 'album', 'gta', 'game release', 'netflix', 'spotify']),
]

def classify(question, slug=''):
    text = (question + ' ' + slug).lower()
    for cat, keywords in CATEGORY_RULES:
        for kw in keywords:
            if kw in text:
                return cat
    return 'Other'


def fetch_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'WintermuteDashboard/1.0'})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"  fetch error: {url[:80]} — {e}")
        return None


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pm_markets (
            market_id TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            slug TEXT,
            category TEXT,
            image_url TEXT,
            end_date DATE,
            clob_token_id TEXT,
            outcomes JSONB,
            url TEXT,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS pm_snapshots (
            market_id TEXT NOT NULL REFERENCES pm_markets(market_id),
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            probability REAL,
            volume_24h REAL,
            volume_total REAL,
            liquidity REAL,
            PRIMARY KEY (market_id, timestamp)
        );
        CREATE TABLE IF NOT EXISTS pm_watchlist (
            market_id TEXT PRIMARY KEY REFERENCES pm_markets(market_id),
            added_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_pm_snapshots_market_ts ON pm_snapshots(market_id, timestamp);
    """)
    conn.commit()
    print("[pm_ingest] tables ensured")


def ingest():
    conn = psycopg2.connect(DATABASE_URL)
    ensure_tables(conn)
    cur = conn.cursor()

    # Fetch top 200 active markets by volume
    print("[pm_ingest] fetching markets from Polymarket...")
    all_markets = []
    for offset in range(0, 200, 100):
        url = f'https://gamma-api.polymarket.com/markets?limit=100&offset={offset}&active=true&closed=false&order=volumeNum&ascending=false'
        data = fetch_json(url)
        if data:
            all_markets.extend(data)
        else:
            break

    print(f"[pm_ingest] fetched {len(all_markets)} markets")
    now = datetime.utcnow()
    upserted = 0
    snapped = 0

    for m in all_markets:
        mid = m.get('id')
        q = m.get('question', '')
        slug = m.get('slug', '')
        if not mid or not q:
            continue

        cat = classify(q, slug)

        # Parse probability
        try:
            prices = json.loads(m.get('outcomePrices', '[]'))
            prob = float(prices[0]) if prices else None
        except:
            prob = None

        try:
            outcomes = json.loads(m.get('outcomes', '[]'))
        except:
            outcomes = []

        # Parse CLOB token ID
        try:
            clob_ids = json.loads(m.get('clobTokenIds', '[]'))
        except:
            clob_ids = []

        vol_24h = float(m.get('volume24hr', 0) or 0)
        vol_total = float(m.get('volumeNum', 0) or 0)
        liquidity = float(m.get('liquidityNum', 0) or 0)
        end_date = m.get('endDateIso')
        image = m.get('image', '')
        url = f"https://polymarket.com/event/{slug}"

        # Upsert market
        cur.execute("""
            INSERT INTO pm_markets (market_id, question, slug, category, image_url, end_date, clob_token_id, outcomes, url, active, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW())
            ON CONFLICT (market_id) DO UPDATE SET
                question = EXCLUDED.question,
                category = EXCLUDED.category,
                image_url = EXCLUDED.image_url,
                end_date = EXCLUDED.end_date,
                clob_token_id = EXCLUDED.clob_token_id,
                outcomes = EXCLUDED.outcomes,
                active = TRUE,
                updated_at = NOW()
        """, (mid, q, slug, cat, image, end_date, clob_ids[0] if clob_ids else None, json.dumps(outcomes), url))
        upserted += 1

        # Insert snapshot
        if prob is not None:
            cur.execute("""
                INSERT INTO pm_snapshots (market_id, timestamp, probability, volume_24h, volume_total, liquidity)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (market_id, timestamp) DO NOTHING
            """, (mid, now, prob, vol_24h, vol_total, liquidity))
            snapped += 1

    # Mark markets not seen in this fetch as inactive
    active_ids = [m.get('id') for m in all_markets if m.get('id')]
    if active_ids:
        cur.execute("UPDATE pm_markets SET active = FALSE WHERE market_id != ALL(%s) AND active = TRUE", (active_ids,))

    conn.commit()
    conn.close()
    print(f"[pm_ingest] done: {upserted} markets upserted, {snapped} snapshots inserted")


if __name__ == '__main__':
    ingest()
