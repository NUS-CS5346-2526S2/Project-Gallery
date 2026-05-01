"""
LLM-based labeling pipeline using GPT-4o-mini.
Classifies each post with: stance, topic, themes, confidence.
Processes in batches of 5 posts per API call for efficiency.
Saves progress every 50 posts so it can resume if interrupted.
"""
import os
import json
import time
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

INPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "combined_clean.csv")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "llm_labeled.csv")
CHECKPOINT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "llm_checkpoint.json")

BATCH_SIZE = 5
MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """You are analyzing Singaporean online discourse about foreign labour/workers.
For each post, classify it and respond with a JSON array.

Each item must have:
{
  "index": <the index number provided>,
  "stance": "anti" | "pro" | "neutral",
  "topic": "Jobs & Employment" | "Policy & Government" | "Economy & Wages" | "Worker Welfare & Rights" | "Identity & Culture" | "General",
  "themes": ["theme1", "theme2"],
  "confidence": 0.0-1.0
}

Stance definitions:
- anti: expresses concern/negativity about foreign workers — job displacement, wage depression, too many foreigners, policy too loose, cultural tension, overcrowding
- pro: defends/supports foreign workers — acknowledges contributions, supports policy, shows empathy for their conditions, argues economy needs them
- neutral: informational, balanced, asks questions, or unrelated to the foreign labour debate

Topic: choose the SINGLE most relevant category.
Themes: 1-3 short descriptive phrases about the specific concerns/points raised (e.g., "job displacement", "CECA policy criticism", "worker exploitation", "cultural integration", "wage competition", "construction sector needs").

Respond ONLY with a valid JSON array. No markdown, no explanation."""


def create_batch_prompt(posts):
    """Create a prompt for a batch of posts."""
    lines = []
    for i, (idx, text) in enumerate(posts):
        # Truncate very long posts
        t = text[:500] if len(text) > 500 else text
        lines.append(f"[{idx}] {t}")
    return "\n\n---\n\n".join(lines)


def classify_batch(client, posts, max_retries=3):
    """Send a batch to GPT-4o-mini and parse results."""
    prompt = create_batch_prompt(posts)

    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=1500,
            )
            content = response.choices[0].message.content.strip()

            # Parse JSON — handle markdown wrapping
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            results = json.loads(content)
            return results

        except (json.JSONDecodeError, Exception) as e:
            if attempt < max_retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"      Retry {attempt + 1} after error: {e} (waiting {wait}s)")
                time.sleep(wait)
            else:
                print(f"      FAILED after {max_retries} attempts: {e}")
                # Return defaults
                return [{"index": idx, "stance": "neutral", "topic": "General",
                         "themes": [], "confidence": 0.0} for idx, _ in posts]


def load_checkpoint():
    """Load progress from checkpoint file."""
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH) as f:
            return json.load(f)
    return {"processed": 0, "results": []}


def save_checkpoint(processed, results):
    """Save progress to checkpoint file."""
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump({"processed": processed, "results": results}, f)


def main():
    print("=== LLM Labeling Pipeline (GPT-4o-mini) ===\n")

    client = OpenAI()

    df = pd.read_csv(INPUT_PATH, encoding="utf-8")
    total = len(df)
    print(f"  Loaded {total} posts from {INPUT_PATH}")

    # Load checkpoint
    checkpoint = load_checkpoint()
    start_idx = checkpoint["processed"]
    all_results = checkpoint["results"]

    if start_idx > 0:
        print(f"  Resuming from post {start_idx} ({start_idx}/{total} done)")

    # Process in batches
    batch = []
    for i in range(start_idx, total):
        row = df.iloc[i]
        text = str(row["text"])
        batch.append((i, text))

        if len(batch) == BATCH_SIZE or i == total - 1:
            results = classify_batch(client, batch)

            # Map results back to indices
            result_map = {r.get("index", batch[j][0]): r for j, r in enumerate(results)}

            for idx, _ in batch:
                r = result_map.get(idx, {"stance": "neutral", "topic": "General", "themes": [], "confidence": 0.0})
                all_results.append({
                    "index": idx,
                    "stance": r.get("stance", "neutral"),
                    "topic": r.get("topic", "General"),
                    "themes": json.dumps(r.get("themes", [])),
                    "confidence": r.get("confidence", 0.0),
                })

            processed = i + 1
            pct = processed / total * 100
            print(f"  [{processed}/{total}] ({pct:.0f}%) — batch stance: {[r.get('stance','?') for r in results]}")

            # Save checkpoint every 50 posts
            if processed % 50 == 0 or i == total - 1:
                save_checkpoint(processed, all_results)

            batch = []
            time.sleep(0.3)  # rate limit safety

    # Build output DataFrame
    print(f"\n  Merging results...")
    result_df = pd.DataFrame(all_results)
    result_df = result_df.set_index("index")

    output = df.copy()
    output["stance"] = result_df["stance"]
    output["topic"] = result_df["topic"]
    output["themes"] = result_df["themes"]
    output["confidence"] = result_df["confidence"]

    output.to_csv(OUTPUT_PATH, index=False, encoding="utf-8")
    print(f"  Saved to {OUTPUT_PATH}")

    # Print distribution
    print(f"\n  === Results ===")
    print(f"  Stance distribution:")
    for stance in ["anti", "pro", "neutral"]:
        count = (output["stance"] == stance).sum()
        print(f"    {stance}: {count} ({count/total*100:.1f}%)")

    print(f"\n  Topic distribution:")
    for topic, count in output["topic"].value_counts().items():
        print(f"    {topic}: {count} ({count/total*100:.1f}%)")

    print(f"\n  Top themes:")
    all_themes = []
    for t in output["themes"]:
        try:
            all_themes.extend(json.loads(t))
        except:
            pass
    from collections import Counter
    for theme, count in Counter(all_themes).most_common(20):
        print(f"    {theme}: {count}")

    # Clean up checkpoint
    if os.path.exists(CHECKPOINT_PATH):
        os.remove(CHECKPOINT_PATH)
    print("\n  Done!")


if __name__ == "__main__":
    main()
