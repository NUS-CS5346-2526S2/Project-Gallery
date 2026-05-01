"""
Data cleaning pipeline: merge raw CSVs, deduplicate, strip HTML, filter.
"""
import os
import re
import hashlib
import pandas as pd
from langdetect import detect, LangDetectException

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "combined_clean.csv")


def load_raw_csvs():
    """Load and merge all raw CSV files."""
    frames = []
    for fname in os.listdir(RAW_DIR):
        if fname.endswith(".csv"):
            path = os.path.join(RAW_DIR, fname)
            df = pd.read_csv(path, encoding="utf-8")
            print(f"  Loaded {fname}: {len(df)} rows")
            frames.append(df)

    if not frames:
        print("  No raw CSV files found!")
        return pd.DataFrame()

    combined = pd.concat(frames, ignore_index=True)
    print(f"  Combined: {len(combined)} rows")
    return combined


def strip_html(text):
    """Remove HTML tags and decode entities."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-zA-Z]+;", " ", text)
    text = re.sub(r"&#?\w+;", " ", text)
    return text.strip()


def clean_text(text):
    """Normalize text: strip HTML, URLs, excessive whitespace."""
    if not isinstance(text, str):
        return ""
    text = strip_html(text)
    # Remove URLs
    text = re.sub(r"https?://\S+", "", text)
    # Remove Reddit markdown artifacts
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def text_hash(text):
    """SHA-256 hash of normalized text for deduplication."""
    normalized = re.sub(r"\s+", " ", text.lower().strip())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def is_english(text):
    """Check if text is primarily English."""
    try:
        return detect(text) == "en"
    except LangDetectException:
        return False


def clean_data(df):
    """Full cleaning pipeline."""
    initial = len(df)

    # 1. Clean text
    df["text"] = df["text"].apply(clean_text)

    # 2. Remove empty or very short posts (< 10 words)
    df = df[df["text"].str.split().str.len() >= 10].copy()
    print(f"  After length filter (>=10 words): {len(df)} rows (removed {initial - len(df)})")

    # 3. Deduplicate by text hash
    df["_hash"] = df["text"].apply(text_hash)
    before_dedup = len(df)
    df = df.drop_duplicates(subset="_hash").copy()
    print(f"  After dedup: {len(df)} rows (removed {before_dedup - len(df)} duplicates)")
    df = df.drop(columns=["_hash"])

    # 4. Language filter (English only)
    before_lang = len(df)
    df = df[df["text"].apply(is_english)].copy()
    print(f"  After English filter: {len(df)} rows (removed {before_lang - len(df)} non-English)")

    # 5. Normalize date column
    df["date"] = pd.to_datetime(df["date"], errors="coerce", utc=True)
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    # 6. Reset index
    df = df.reset_index(drop=True)

    print(f"  Final cleaned dataset: {len(df)} rows (from {initial} original)")
    return df


def main():
    print("=== Data Cleaning Pipeline ===")
    df = load_raw_csvs()
    if df.empty:
        return

    df = clean_data(df)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8")
    print(f"  Saved to {OUTPUT_PATH}")

    # Print sample
    print("\n  Sample rows:")
    for _, row in df.sample(min(5, len(df))).iterrows():
        print(f"    [{row['source']}] {row['text'][:80]}...")


if __name__ == "__main__":
    main()
