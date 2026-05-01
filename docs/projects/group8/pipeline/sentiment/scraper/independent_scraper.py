"""
The Independent Singapore scraper — articles about foreign workers.
Extracts article text + embedded public opinions from social media.
"""
import os
import csv
import time
import re
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup

import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import OUTPUT_DIR

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

SEARCH_TERMS = [
    "foreign workers",
    "foreign talent",
    "CECA",
    "migrant workers",
    "employment pass",
    "foreigners jobs",
]

MAX_PAGES = 5  # per search term
ARTICLES_PER_PAGE = 10


def get_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s


def search_articles(session, query, max_pages=MAX_PAGES):
    """Search theindependent.sg for articles."""
    articles = []
    for page in range(1, max_pages + 1):
        url = f"https://theindependent.sg/page/{page}/?s={quote_plus(query)}"
        try:
            resp = session.get(url, timeout=15)
            if resp.status_code != 200:
                break
            soup = BeautifulSoup(resp.text, "lxml")

            # Find article links
            links = soup.select("h3.entry-title a, h2.entry-title a, .td-module-title a")
            if not links:
                links = soup.select("a[rel='bookmark']")
            if not links:
                break

            for link in links:
                href = link.get("href", "")
                title = link.get_text(strip=True)
                if href and title and "theindependent.sg" in href:
                    articles.append({"url": href, "title": title})

            time.sleep(2)
        except Exception as e:
            print(f"    Search page {page} error: {e}")
            break

    return articles


def scrape_article(session, url, title):
    """Scrape article body text."""
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "lxml")

        # Get article body
        body = (soup.select_one("div.td-post-content") or
                soup.select_one("div.entry-content") or
                soup.select_one("article"))
        if not body:
            return None

        # Extract paragraphs
        paragraphs = body.find_all("p")
        text = " ".join(p.get_text(strip=True) for p in paragraphs)

        if len(text) < 50:
            return None

        # Try to extract date
        time_el = soup.select_one("time, .td-post-date time, .entry-date")
        date = ""
        if time_el:
            date = time_el.get("datetime", "")[:10]

        return {"text": text, "date": date}

    except Exception as e:
        return None


def main():
    print("=== The Independent SG Scraper ===")
    session = get_session()
    seen_urls = set()
    all_rows = []
    article_id = 0

    for query in SEARCH_TERMS:
        print(f"\n  Searching for: '{query}'")
        articles = search_articles(session, query)
        print(f"    Found {len(articles)} articles")

        for article in articles:
            if article["url"] in seen_urls:
                continue
            seen_urls.add(article["url"])

            data = scrape_article(session, article["url"], article["title"])
            if not data:
                continue

            article_id += 1
            all_rows.append({
                "id": f"indsg_{article_id}",
                "text": data["text"],
                "title": article["title"],
                "score": 0,
                "date": data["date"],
                "author": "theindependent.sg",
                "source": "independent_sg",
                "type": "article",
            })
            time.sleep(2)

        time.sleep(3)

    # Save
    outpath = os.path.join(OUTPUT_DIR, "independent_sg_raw.csv")
    os.makedirs(os.path.dirname(outpath), exist_ok=True)
    if all_rows:
        with open(outpath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_rows[0].keys())
            writer.writeheader()
            writer.writerows(all_rows)
    print(f"\n  Total: {len(all_rows)} articles saved to {outpath}")


if __name__ == "__main__":
    main()
