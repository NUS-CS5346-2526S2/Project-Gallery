"""
Step 2: Standardize resident employment by industry from SingStat JSON.

Reads employed_residents_by_industry.json (table M182131) and outputs a long-format
CSV with columns: year, sector_key, resident_employment_thousands.

Only the first 17 series (aggregate totals) are used — the rest are age-group breakdowns.
"""

import json
import pandas as pd
from src.config import RAW_FILES, INTERIM_FILES, MAPPINGS_DIR

RES_NAME_TO_SECTOR_KEY = {}


def _load_mapping():
    global RES_NAME_TO_SECTOR_KEY
    mapping = pd.read_csv(MAPPINGS_DIR / "industry_code_mapping.csv")
    for _, row in mapping.iterrows():
        name = row["resident_emp_json_name"]
        if pd.notna(name) and name.strip():
            RES_NAME_TO_SECTOR_KEY[name.strip()] = row["sector_key"]


def extract_resident_employment() -> pd.DataFrame:
    with open(RAW_FILES["resident_emp"]) as f:
        data = json.load(f)

    rows = data["Data"]["row"]
    records = []

    for r in rows[:17]:  # first 17 = aggregate totals
        name = r["rowText"].strip()
        sector_key = RES_NAME_TO_SECTOR_KEY.get(name)
        if sector_key is None:
            print(f"  [WARN] No mapping for resident JSON name: '{name}'")
            continue
        for col in r.get("columns", []):
            year_str = col["key"]
            value = col.get("value")
            if value and value != "na" and year_str.isdigit():
                records.append({
                    "year": int(year_str),
                    "sector_key": sector_key,
                    "resident_employment_thousands": float(value),
                })

    return pd.DataFrame(records)


def main():
    print("Step 2: Standardizing resident employment by industry (M182131)...")
    _load_mapping()
    df = extract_resident_employment()
    df = df.sort_values(["sector_key", "year"]).reset_index(drop=True)
    df.to_csv(INTERIM_FILES["resident_emp"], index=False)
    print(f"  Wrote {len(df)} rows ({df['sector_key'].nunique()} sectors, "
          f"{df['year'].min()}-{df['year'].max()}) → {INTERIM_FILES['resident_emp'].name}")
    return df


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    main()
