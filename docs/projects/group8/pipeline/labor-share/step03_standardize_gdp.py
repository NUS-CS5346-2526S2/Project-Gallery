"""
Step 3: Standardize GDP by industry from SingStat JSON (annual table M015731).

Reads gdp_by_industry_annual.json and outputs a long-format CSV with columns:
year, sector_key, gdp_current_million_sgd.
"""

import json
import pandas as pd
from src.config import RAW_FILES, INTERIM_FILES, MAPPINGS_DIR

GDP_NAME_TO_SECTOR_KEY = {}


def _load_mapping():
    global GDP_NAME_TO_SECTOR_KEY
    mapping = pd.read_csv(MAPPINGS_DIR / "industry_code_mapping.csv")
    for _, row in mapping.iterrows():
        name = row["gdp_json_name"]
        if pd.notna(name) and name.strip():
            GDP_NAME_TO_SECTOR_KEY[name.strip()] = row["sector_key"]


def extract_gdp() -> pd.DataFrame:
    with open(RAW_FILES["gdp_annual"]) as f:
        data = json.load(f)

    rows = data["Data"]["row"]
    records = []

    for r in rows:
        name = r["rowText"].strip()
        sector_key = GDP_NAME_TO_SECTOR_KEY.get(name)
        if sector_key is None:
            continue  # skip unmapped GDP rows (aggregates, taxes, etc.)
        uom = r.get("uoM", "")
        for col in r.get("columns", []):
            year_str = col["key"]
            value = col.get("value")
            if value and value != "na" and year_str.isdigit():
                records.append({
                    "year": int(year_str),
                    "sector_key": sector_key,
                    "gdp_current_million_sgd": float(value),
                })

    return pd.DataFrame(records)


def main():
    print("Step 3: Standardizing GDP by industry (M015731)...")
    _load_mapping()
    df = extract_gdp()
    df = df.sort_values(["sector_key", "year"]).reset_index(drop=True)
    df.to_csv(INTERIM_FILES["gdp"], index=False)
    print(f"  Wrote {len(df)} rows ({df['sector_key'].nunique()} sectors, "
          f"{df['year'].min()}-{df['year'].max()}) → {INTERIM_FILES['gdp'].name}")
    return df


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    main()
