#!/usr/bin/env python3
"""
cron/sector_index_backfill.py — Precompute equal-weighted sector indices.

Creates sector_index_daily table and fills it with rebased-to-100 EW index
for each sector from sectors.json.

Run: DATABASE_URL="postgresql://..." python3 sector_index_backfill.py
"""
import os, sys, json, math
from datetime import datetime
from collections import defaultdict
from pathlib import Path
import psycopg2
import psycopg2.extras

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("[sector_index] ERROR: DATABASE_URL not set")
    sys.exit(1)

# Load sectors
SECTORS_FILE = Path(__file__).parent.parent / "sectors.json"
if not SECTORS_FILE.exists():
    print(f"[sector_index] ERROR: {SECTORS_FILE} not found")
    sys.exit(1)

with open(SECTORS_FILE) as f:
    SECTORS = json.load(f)

print(f"[sector_index] Loaded {len(SECTORS)} sectors")


def ensure_table(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sector_index_daily (
            timestamp DATE NOT NULL,
            sector TEXT NOT NULL,
            ew_value REAL,
            asset_count INTEGER,
            PRIMARY KEY (timestamp, sector)
        );
        CREATE INDEX IF NOT EXISTS idx_sector_index_sector_ts
            ON sector_index_daily(sector, timestamp);
    """)
    conn.commit()
    print("[sector_index] Table ensured")


def backfill():
    conn = psycopg2.connect(DATABASE_URL)
    ensure_table(conn)
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Check what we already have
    cur.execute("SELECT sector, MAX(timestamp) as last_date FROM sector_index_daily GROUP BY sector")
    existing = {r['sector']: str(r['last_date']) for r in cur.fetchall()}

    total_inserted = 0

    for sector_name, cg_ids in SECTORS.items():
        if not cg_ids:
            continue

        last_date = existing.get(sector_name)
        start_from = last_date if last_date else '2013-01-01'

        print(f"\n[{sector_name}] {len(cg_ids)} tokens, resuming from {start_from}")

        # Fetch all prices
        cur.execute("""
            SELECT coingecko_id, timestamp::date as date, price_usd
            FROM price_daily
            WHERE coingecko_id = ANY(%s)
              AND price_usd > 0
            ORDER BY coingecko_id, timestamp
        """, (cg_ids,))
        rows = cur.fetchall()

        if not rows:
            print(f"  No price data")
            continue

        # Build per-asset price maps
        asset_prices = defaultdict(dict)
        for r in rows:
            asset_prices[r['coingecko_id']][str(r['date'])] = float(r['price_usd'])

        # All unique dates
        all_dates = sorted(set(d for p in asset_prices.values() for d in p))
        print(f"  {len(asset_prices)} assets, {len(all_dates)} dates ({all_dates[0]} to {all_dates[-1]})")

        # Rebase each asset to 100 from its first price
        rebased = {}
        for cid, prices in asset_prices.items():
            sorted_d = sorted(prices)
            first = prices[sorted_d[0]]
            if first > 0:
                rebased[cid] = {d: prices[d] / first * 100 for d in sorted_d}

        if not rebased:
            print(f"  No valid rebased series")
            continue

        min_assets = max(1, len(rebased) // 2)

        # Compute EW index per date
        batch = []
        for date in all_dates:
            if date <= start_from:
                continue

            vals = [s[date] for s in rebased.values() if date in s]
            if len(vals) < min_assets:
                continue

            ew = sum(vals) / len(vals)
            batch.append((date, sector_name, round(ew, 4), len(vals)))

        if not batch:
            print(f"  No new dates to insert")
            continue

        # Rebase the EW index itself to 100 from its first value
        first_ew = batch[0][2]
        if first_ew and first_ew > 0:
            batch = [(d, s, round(v / first_ew * 100, 4), c) for d, s, v, c in batch]

        # Bulk insert
        psycopg2.extras.execute_values(
            conn.cursor(),
            """INSERT INTO sector_index_daily (timestamp, sector, ew_value, asset_count)
               VALUES %s
               ON CONFLICT (timestamp, sector) DO UPDATE SET
                 ew_value = EXCLUDED.ew_value,
                 asset_count = EXCLUDED.asset_count""",
            batch,
            template="(%s, %s, %s, %s)"
        )
        conn.commit()
        total_inserted += len(batch)
        print(f"  Inserted {len(batch)} rows")

    conn.close()
    print(f"\n[sector_index] Done: {total_inserted} total rows inserted")


if __name__ == '__main__':
    backfill()
