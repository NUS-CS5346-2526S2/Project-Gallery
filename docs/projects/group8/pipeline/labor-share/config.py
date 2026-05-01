"""Paths and constants for the SG Foreign Workers data pipeline."""

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"
MAPPINGS_DIR = PROJECT_ROOT / "mappings"

# ---------- Raw file names ----------
RAW_FILES = {
    "total_emp_level": RAW_DIR / "mom_emp_level_by_ind.xlsx",
    "resident_emp": RAW_DIR / "employed_residents_by_industry.json",
    "emp_change_by_res": RAW_DIR / "mom_emp_by_ind_and_res_stat.csv",
    "emp_by_sector": RAW_DIR / "employment_by_sector_annual.json",
    "gdp_annual": RAW_DIR / "gdp_by_industry_annual.json",
    "gdp_quarterly": RAW_DIR / "gdp_by_industry_quarterly.json",
    "labour_force": RAW_DIR / "labour_force_annual.json",
    "nonresident_pass": RAW_DIR / "nonresident_pass_types_annual.json",
}

# ---------- Interim file names ----------
INTERIM_FILES = {
    "total_emp": INTERIM_DIR / "total_employment_by_industry.csv",
    "resident_emp": INTERIM_DIR / "resident_employment_by_industry.csv",
    "emp_change": INTERIM_DIR / "employment_change_by_res_status.csv",
    "gdp": INTERIM_DIR / "gdp_by_industry_annual.csv",
    "labour_force": INTERIM_DIR / "labour_force_annual.csv",
    "nonresident_pass": INTERIM_DIR / "nonresident_pass_types.csv",
}

# ---------- Processed file names ----------
PROCESSED_FILES = {
    "merged": PROCESSED_DIR / "merged_employment_gdp.csv",
    "foreign_share": PROCESSED_DIR / "foreign_worker_share_by_industry.csv",
    "summary": PROCESSED_DIR / "summary_statistics.csv",
}

# ---------- Mapping file ----------
INDUSTRY_MAP_FILE = MAPPINGS_DIR / "industry_code_mapping.csv"

# ---------- Analysis period (SSIC 2020 overlap) ----------
ANALYSIS_START_YEAR = 2009  # first full year on SSIC 2020 in total emp XLSX
ANALYSIS_END_YEAR = 2025
