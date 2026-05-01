"""
Step 4: Merge employment datasets (total + resident) and GDP, then derive
non-resident employment by industry.

Produces merged_employment_gdp.csv with columns:
  year, sector_key, total_employment_thousands, resident_employment_thousands,
  nonresident_employment_thousands, gdp_current_million_sgd

Note on timing:
  - Total employment is year-end (December) from admin records
  - Resident employment is mid-year (June) from Labour Force Survey
  - The ~6-month gap introduces noise but does not invalidate trend analysis
"""

import pandas as pd
from src.config import INTERIM_FILES, PROCESSED_FILES, ANALYSIS_START_YEAR, ANALYSIS_END_YEAR, MAPPINGS_DIR


def load_mapping() -> pd.DataFrame:
    return pd.read_csv(MAPPINGS_DIR / "industry_code_mapping.csv")


def merge_datasets() -> pd.DataFrame:
    total = pd.read_csv(INTERIM_FILES["total_emp"])
    resident = pd.read_csv(INTERIM_FILES["resident_emp"])
    gdp = pd.read_csv(INTERIM_FILES["gdp"])

    # Filter to analysis period
    total = total[total["year"].between(ANALYSIS_START_YEAR, ANALYSIS_END_YEAR)]
    resident = resident[resident["year"].between(ANALYSIS_START_YEAR, ANALYSIS_END_YEAR)]
    gdp = gdp[gdp["year"].between(ANALYSIS_START_YEAR, ANALYSIS_END_YEAR)]

    # Merge total + resident on (year, sector_key)
    merged = pd.merge(
        total, resident,
        on=["year", "sector_key"],
        how="outer",
    )

    # Merge with GDP
    merged = pd.merge(
        merged, gdp,
        on=["year", "sector_key"],
        how="outer",
    )

    # Derive non-resident employment
    mask = merged["total_employment_thousands"].notna() & merged["resident_employment_thousands"].notna()
    merged.loc[mask, "nonresident_employment_thousands"] = (
        merged.loc[mask, "total_employment_thousands"]
        - merged.loc[mask, "resident_employment_thousands"]
    )

    # Flag rows where derivation produces negative values (timing/methodology artifact)
    neg_mask = merged["nonresident_employment_thousands"] < 0
    merged["data_quality_flag"] = ""
    merged.loc[neg_mask, "data_quality_flag"] = (
        "NEGATIVE_DERIVED: total(Dec admin) < resident(Jun survey); "
        "timing/methodology mismatch"
    )

    # Add sector metadata from mapping
    mapping = load_mapping()[["sector_key", "level", "parent_sector_key", "ssic_2020_code"]]
    merged = pd.merge(merged, mapping, on="sector_key", how="left")

    merged = merged.sort_values(["year", "level", "sector_key"]).reset_index(drop=True)
    return merged


def main():
    print("Step 4: Merging total employment + resident employment + GDP...")
    df = merge_datasets()
    df.to_csv(PROCESSED_FILES["merged"], index=False)

    # Stats
    has_both = df.dropna(subset=["total_employment_thousands", "resident_employment_thousands"])
    has_gdp = df["gdp_current_million_sgd"].notna().sum()
    print(f"  Total rows: {len(df)}")
    print(f"  Rows with derived non-resident: {len(has_both)}")
    print(f"  Rows with GDP: {has_gdp}")
    print(f"  Year range: {df['year'].min()}-{df['year'].max()}")
    print(f"  Sectors: {df['sector_key'].nunique()}")
    print(f"  → {PROCESSED_FILES['merged'].name}")
    return df


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    main()
