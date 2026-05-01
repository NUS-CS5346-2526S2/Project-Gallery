"""
Aggregate LLM-labeled discourse data + MOM data into viz_data.json for D3.js.
"""
import os
import json
import re
import pandas as pd
from collections import Counter

LLM_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "llm_labeled.csv")
MOM_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "mom_data.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "viz", "viz_data.json")


def aggregate_by_topic(df):
    topics = []
    for topic, g in df.groupby("topic"):
        sc = g["stance"].value_counts()
        total = len(g)
        anti = int(sc.get("anti", 0))
        pro = int(sc.get("pro", 0))
        topics.append({
            "topic": topic, "anti": anti, "pro": pro,
            "neutral": int(sc.get("neutral", 0)), "total": total,
            "antiPct": round(anti / total * 100, 1) if total else 0,
            "proPct": round(pro / total * 100, 1) if total else 0,
        })
    topics.sort(key=lambda x: x["total"], reverse=True)
    return topics


def aggregate_by_source(df):
    return [{
        "source": src, "total": len(g),
        "anti": int(g["stance"].value_counts().get("anti", 0)),
        "pro": int(g["stance"].value_counts().get("pro", 0)),
        "neutral": int(g["stance"].value_counts().get("neutral", 0)),
    } for src, g in df.groupby("source")]


def aggregate_by_topic_and_source(df):
    result = []
    for (topic, source), g in df.groupby(["topic", "source"]):
        sc = g["stance"].value_counts()
        result.append({
            "topic": topic, "source": source, "total": len(g),
            "anti": int(sc.get("anti", 0)), "pro": int(sc.get("pro", 0)),
            "neutral": int(sc.get("neutral", 0)),
        })
    return result


def aggregate_by_year(df):
    yearly = []
    for year, g in df.groupby(df["date"].dt.year):
        if pd.isna(year):
            continue
        sc = g["stance"].value_counts()
        total = len(g)
        anti = int(sc.get("anti", 0))
        pro = int(sc.get("pro", 0))
        yearly.append({
            "year": int(year), "total": total, "anti": anti, "pro": pro,
            "neutral": int(sc.get("neutral", 0)),
            "antiPct": round(anti / total * 100, 1) if total else 0,
            "proPct": round(pro / total * 100, 1) if total else 0,
        })
    yearly.sort(key=lambda x: x["year"])
    return yearly


def aggregate_themes(df):
    """Extract top themes for anti and pro posts from LLM themes field."""
    anti_themes = Counter()
    pro_themes = Counter()

    for _, row in df.iterrows():
        try:
            themes = json.loads(str(row["themes"]))
        except (json.JSONDecodeError, TypeError):
            continue

        # Normalize theme names
        normalized = [t.strip().lower() for t in themes if isinstance(t, str) and len(t.strip()) > 2]

        if row["stance"] == "anti":
            anti_themes.update(normalized)
        elif row["stance"] == "pro":
            pro_themes.update(normalized)

    # Top 12 each, filter out very generic ones
    generic = {"personal experience", "general discussion", "social media", "news article", "general"}
    anti_list = [{"theme": t, "count": c} for t, c in anti_themes.most_common(20) if t not in generic][:12]
    pro_list = [{"theme": t, "count": c} for t, c in pro_themes.most_common(20) if t not in generic][:12]

    return {"anti": anti_list, "pro": pro_list}


def aggregate_topic_by_year(df):
    """Topic counts per year for stacked area chart."""
    result = []
    topics_to_show = [t for t in df["topic"].unique() if t != "General"]

    for year, g in df.groupby(df["date"].dt.year):
        if pd.isna(year):
            continue
        entry = {"year": int(year)}
        topic_counts = g["topic"].value_counts()
        for topic in topics_to_show:
            entry[topic] = int(topic_counts.get(topic, 0))
        result.append(entry)

    result.sort(key=lambda x: x["year"])
    return result


def get_sample_posts(df, n=3):
    samples = []
    for (topic, stance), g in df.groupby(["topic", "stance"]):
        sample = g.head(n)
        for _, row in sample.iterrows():
            text = str(row["text"])[:200]
            if len(str(row["text"])) > 200:
                text += "..."
            samples.append({"topic": topic, "stance": stance, "text": text, "source": row.get("source", "")})
    return samples


def main():
    print("=== Aggregation (LLM labels + MOM data) ===")

    df = pd.read_csv(LLM_PATH, encoding="utf-8")
    print(f"  Loaded {len(df)} LLM-labeled posts")

    # Keep only Reddit and Independent SG (HWZ=19, news=17 too small to be meaningful)
    df = df[df["source"].isin(["reddit", "independent_sg"])].copy()
    print(f"  Filtered to Reddit + Independent SG: {len(df)} rows")

    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df[df["date"].dt.year.between(2015, 2026)].copy()
    print(f"  Filtered to 2015-2026: {len(df)} rows")

    with open(MOM_PATH) as f:
        mom = json.load(f)

    themes = aggregate_themes(df)
    topic_by_year = aggregate_topic_by_year(df)

    output = {
        "perception": {
            "byTopic": aggregate_by_topic(df),
            "bySource": aggregate_by_source(df),
            "byTopicAndSource": aggregate_by_topic_and_source(df),
            "byYear": aggregate_by_year(df),
            "themes": themes,
            "topicByYear": topic_by_year,
            "samplePosts": get_sample_posts(df),
        },
        "reality": mom,
        "meta": {
            "totalPosts": len(df),
            "sources": sorted(df["source"].unique().tolist()),
            "topics": [t["topic"] for t in aggregate_by_topic(df)],
            "dataRange": "2015-2025",
            "classifier": "GPT-4o-mini",
        },
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"  Saved to {OUTPUT_PATH}")
    print(f"\n  Stance: anti={sum(1 for _ in df[df.stance=='anti'].iterrows())}, pro={sum(1 for _ in df[df.stance=='pro'].iterrows())}, neutral={sum(1 for _ in df[df.stance=='neutral'].iterrows())}")
    print(f"  Top anti themes: {[t['theme'] for t in themes['anti'][:5]]}")
    print(f"  Top pro themes: {[t['theme'] for t in themes['pro'][:5]]}")
    print(f"  Topic-by-year: {len(topic_by_year)} years")


if __name__ == "__main__":
    main()
