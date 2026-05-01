"""
Reddit scraper for r/singapore foreign labour discussions.
Uses Reddit's public JSON endpoints (no API credentials needed).
"""
import os
import csv
import time
import json

import requests

from config import SEARCH_QUERIES, REQUEST_DELAY, OUTPUT_DIR

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

MAX_PAGES_PER_QUERY = 3


def get_session():
    session = requests.Session()
    session.headers.update(HEADERS)
    return session


def search_posts(session, query):
    """Search r/singapore using Reddit's public JSON API."""
    posts = []
    after = None

    for page in range(MAX_PAGES_PER_QUERY):
        url = "https://www.reddit.com/r/singapore/search.json"
        params = {
            "q": query,
            "restrict_sr": "on",
            "sort": "relevance",
            "t": "all",
            "limit": 50,
        }
        if after:
            params["after"] = after

        try:
            resp = session.get(url, params=params, timeout=15)
            if resp.status_code == 429:
                wait = int(resp.headers.get("Retry-After", 10))
                print(f"    Rate limited, waiting {wait}s...")
                time.sleep(wait)
                resp = session.get(url, params=params, timeout=15)
            if resp.status_code != 200:
                print(f"    HTTP {resp.status_code} for query '{query}'")
                break

            data = resp.json()
            children = data.get("data", {}).get("children", [])
            if not children:
                break

            for child in children:
                d = child.get("data", {})
                posts.append({
                    "id": d.get("id", ""),
                    "title": d.get("title", ""),
                    "text": d.get("selftext", "") or d.get("title", ""),
                    "score": d.get("score", 0),
                    "date": d.get("created_utc", 0),
                    "author": d.get("author", "[deleted]"),
                    "permalink": d.get("permalink", ""),
                    "num_comments": d.get("num_comments", 0),
                })

            after = data.get("data", {}).get("after")
            if not after:
                break

        except Exception as e:
            print(f"    Error on page {page + 1}: {e}")
            break

        time.sleep(REQUEST_DELAY)

    return posts


def scrape_comments(session, permalink, title, max_comments=20):
    """Scrape comments from a single post using JSON endpoint."""
    comments = []
    if not permalink:
        return comments

    url = f"https://www.reddit.com{permalink}.json"
    try:
        resp = session.get(url, params={"limit": max_comments, "sort": "top"}, timeout=15)
        if resp.status_code == 429:
            time.sleep(10)
            resp = session.get(url, params={"limit": max_comments, "sort": "top"}, timeout=15)
        if resp.status_code != 200:
            return comments

        data = resp.json()
        if len(data) < 2:
            return comments

        comment_listing = data[1].get("data", {}).get("children", [])
        for child in comment_listing:
            if child.get("kind") != "t1":
                continue
            cd = child.get("data", {})
            body = cd.get("body", "")
            if body and body not in ("[deleted]", "[removed]"):
                comments.append({
                    "id": cd.get("id", ""),
                    "text": body,
                    "title": title,
                    "score": cd.get("score", 0),
                    "date": cd.get("created_utc", 0),
                    "author": cd.get("author", "[deleted]"),
                    "source": "reddit",
                    "type": "comment",
                })

    except Exception as e:
        print(f"    Error scraping comments: {e}")

    return comments


def format_date(utc_timestamp):
    """Convert UTC timestamp to ISO date string."""
    try:
        from datetime import datetime, timezone
        return datetime.fromtimestamp(float(utc_timestamp), tz=timezone.utc).strftime("%Y-%m-%d")
    except (ValueError, TypeError, OSError):
        return ""


def scrape_reddit():
    session = get_session()
    seen_ids = set()
    all_rows = []
    comment_count = 0
    max_comment_posts = 30  # limit comment scraping to avoid rate limits

    for query in SEARCH_QUERIES:
        print(f"  Searching r/singapore for: '{query}'")
        posts = search_posts(session, query)
        print(f"    Found {len(posts)} posts")

        for post in posts:
            if post["id"] in seen_ids:
                continue
            seen_ids.add(post["id"])

            all_rows.append({
                "id": post["id"],
                "text": post["text"],
                "title": post["title"],
                "score": post["score"],
                "date": format_date(post["date"]),
                "author": post["author"],
                "source": "reddit",
                "type": "post",
            })

            # Scrape comments only for high-engagement posts, with a cap
            if post["num_comments"] >= 10 and comment_count < max_comment_posts:
                comment_count += 1
                print(f"    Scraping comments for: {post['title'][:50]}...")
                comments = scrape_comments(session, post["permalink"], post["title"])
                for c in comments:
                    if c["id"] not in seen_ids:
                        seen_ids.add(c["id"])
                        c["date"] = format_date(c["date"])
                        all_rows.append(c)
                time.sleep(REQUEST_DELAY + 1)

    return all_rows


def save_to_csv(rows, filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    if not rows:
        print("  No rows to save.")
        return
    fieldnames = rows[0].keys()
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Saved {len(rows)} rows to {filepath}")


def main():
    print("=== Reddit Scraper (JSON endpoint, no API key) ===")
    rows = scrape_reddit()
    outpath = os.path.join(OUTPUT_DIR, "reddit_raw.csv")
    save_to_csv(rows, outpath)
    print(f"  Total Reddit items: {len(rows)}")
    return rows


if __name__ == "__main__":
    main()
