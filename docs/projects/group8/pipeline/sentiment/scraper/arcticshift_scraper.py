"""
Arctic Shift scraper — Pushshift replacement for historical Reddit data.
Fills gaps in 2015-2019 and gets posts we missed.
"""
import os
import csv
import time
import requests
from datetime import datetime, timezone

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import SEARCH_QUERIES, OUTPUT_DIR

BASE_URL = "https://arctic-shift.photon-reddit.com/api"
HEADERS = {"User-Agent": "sg-foreign-labour-viz/1.0"}

SUBREDDITS = ["singapore", "askSingapore", "SingaporeRaw"]
# Focus search terms on the core topic
SEARCH_TERMS = [
    "foreign worker", "foreign talent", "CECA",
    "migrant worker", "foreign labour", "PMET",
    "employment pass", "work permit", "S pass",
    "foreigners jobs", "locals replaced",
]


def get_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def search_posts(session, subreddit, query, limit=100, max_pages=5):
    """Search posts via Arctic Shift API with pagination."""
    all_posts = []
    before = None

    for page in range(max_pages):
        params = {
            "subreddit": subreddit,
            "title": query,
            "limit": limit,
            "sort": "desc",
        }
        if before:
            params["before"] = before

        try:
            resp = session.get(f"{BASE_URL}/posts/search", params=params, timeout=15)
            if resp.status_code != 200:
                break

            data = resp.json()
            posts = data.get("data", [])
            if not posts:
                break

            all_posts.extend(posts)
            # Get timestamp of last post for pagination
            before = posts[-1].get("created_utc")
            if not before:
                break

        except Exception as e:
            print(f"      Error: {e}")
            break

        time.sleep(1)

    return all_posts


def format_date(utc):
    try:
        return datetime.fromtimestamp(int(utc), tz=timezone.utc).strftime("%Y-%m-%d")
    except (ValueError, TypeError, OSError):
        return ""


def main():
    print("=== Arctic Shift Scraper (Historical Reddit) ===")
    session = get_session()
    seen_ids = set()
    all_rows = []

    for subreddit in SUBREDDITS:
        print(f"\n  r/{subreddit}:")
        for query in SEARCH_TERMS:
            posts = search_posts(session, subreddit, query, limit=100, max_pages=3)
            new = 0
            for p in posts:
                pid = p.get("id", "")
                if pid in seen_ids:
                    continue
                seen_ids.add(pid)
                new += 1

                text = p.get("selftext", "") or p.get("title", "")
                all_rows.append({
                    "id": pid,
                    "text": text,
                    "title": p.get("title", ""),
                    "score": p.get("score", 0),
                    "date": format_date(p.get("created_utc", 0)),
                    "author": p.get("author", "[deleted]"),
                    "source": "reddit",
                    "type": "post",
                })

            if new > 0:
                print(f"    '{query}': +{new} new posts")
            time.sleep(1)

    # Save
    outpath = os.path.join(OUTPUT_DIR, "arcticshift_raw.csv")
    os.makedirs(os.path.dirname(outpath), exist_ok=True)
    if all_rows:
        with open(outpath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_rows[0].keys())
            writer.writeheader()
            writer.writerows(all_rows)
    print(f"\n  Total: {len(all_rows)} posts saved to {outpath}")

    # Year breakdown
    from collections import Counter
    years = Counter(r["date"][:4] for r in all_rows if r["date"])
    print("  By year:", dict(sorted(years.items())))


if __name__ == "__main__":
    main()
