"""
Step 5: Compute foreign worker share metrics per industry per year.

Produces foreign_worker_share_by_industry.csv with columns:
  year, sector_key, level, parent_sector_key, ssic_2020_code,
  total_employment_thousands, resident_employment_thousands,
  nonresident_employment_thousands, nonresident_share_pct,
  gdp_current_million_sgd, gdp_per_worker_thousand_sgd,
  yoy_total_change_pct, yoy_nonresident_change_pct, yoy_resident_change_pct

Also produces summary_statistics.csv aggregating key metrics.
"""

import pandas as pd
from src.config import PROCESSED_FILES


def compute_metrics(df: pd.DataFrame) -> pd.DataFrame:
    # Non-resident share
    mask = (
        df["total_employment_thousands"].notna()
        & df["nonresident_employment_thousands"].notna()
        & (df["total_employment_thousands"] > 0)
    )
    df.loc[mask, "nonresident_share_pct"] = (
        df.loc[mask, "nonresident_employment_thousands"]
        / df.loc[mask, "total_employment_thousands"]
        * 100
    ).round(2)

    # GDP per worker (SGD thousands)
    mask_gdp = (
        df["gdp_current_million_sgd"].notna()
        & df["total_employment_thousands"].notna()
        & (df["total_employment_thousands"] > 0)
    )
    # million SGD ÷ thousands of workers = thousand SGD per worker (no multiplier needed)
    df.loc[mask_gdp, "gdp_per_worker_thousand_sgd"] = (
        df.loc[mask_gdp, "gdp_current_million_sgd"]
        / df.loc[mask_gdp, "total_employment_thousands"]
    ).round(2)

    # Year-over-year changes
    df = df.sort_values(["sector_key", "year"])
    for col_src, col_dst in [
        ("total_employment_thousands", "yoy_total_change_pct"),
        ("nonresident_employment_thousands", "yoy_nonresident_change_pct"),
        ("resident_employment_thousands", "yoy_resident_change_pct"),
    ]:
        df[col_dst] = (
            df.groupby("sector_key")[col_src]
            .pct_change()
            .mul(100)
            .round(2)
        )

    return df


def build_summary(df: pd.DataFrame) -> pd.DataFrame:
    """Create a summary table: latest year snapshot + trend over period."""
    latest_year = df["year"].max()
    earliest_year = df["year"].min()

    # Only use rows that have both employment figures (level 1-2 sectors)
    detail = df[df["level"].isin([1, 2]) & df["nonresident_share_pct"].notna()].copy()

    latest = detail[detail["year"] == latest_year][
        ["sector_key", "level", "total_employment_thousands",
         "resident_employment_thousands", "nonresident_employment_thousands",
         "nonresident_share_pct", "gdp_current_million_sgd", "gdp_per_worker_thousand_sgd"]
    ].copy()
    latest = latest.rename(columns={
        "nonresident_share_pct": f"nonresident_share_pct_{latest_year}",
    })

    # Earliest share for comparison
    first_avail = (
        detail.groupby("sector_key")
        .apply(lambda g: g.sort_values("year").iloc[0][["year", "nonresident_share_pct"]])
        .reset_index()
    )
    first_avail.columns = ["sector_key", "earliest_year", "nonresident_share_pct_earliest"]

    summary = pd.merge(latest, first_avail, on="sector_key", how="left")
    summary["share_change_pp"] = (
        summary[f"nonresident_share_pct_{latest_year}"]
        - summary["nonresident_share_pct_earliest"]
    ).round(2)

    summary = summary.sort_values("level").reset_index(drop=True)
    return summary


def main():
    print("Step 5: Computing foreign worker share metrics...")
    df = pd.read_csv(PROCESSED_FILES["merged"])
    df = compute_metrics(df)
    df.to_csv(PROCESSED_FILES["foreign_share"], index=False)
    print(f"  Wrote {len(df)} rows → {PROCESSED_FILES['foreign_share'].name}")

    summary = build_summary(df)
    summary.to_csv(PROCESSED_FILES["summary"], index=False)
    print(f"  Wrote {len(summary)} row summary → {PROCESSED_FILES['summary'].name}")

    # Print highlights
    print("\n  === Latest Year Snapshot ===")
    cols = ["sector_key", f"nonresident_share_pct_{df['year'].max()}", "share_change_pp"]
    avail = [c for c in cols if c in summary.columns]
    print(summary[avail].to_string(index=False))
    return df, summary


if __name__ == "__main__":
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    main()
