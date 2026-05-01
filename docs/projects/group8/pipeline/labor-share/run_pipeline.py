#!/usr/bin/env python3
"""
Run the full data pipeline end-to-end.

Usage:
    cd sg-foreign-workers
    python -m src.run_pipeline
"""

from src.step01_standardize_total_employment import main as step01
from src.step02_standardize_resident_employment import main as step02
from src.step03_standardize_gdp import main as step03
from src.step04_merge_datasets import main as step04
from src.step05_compute_metrics import main as step05
from src.step06_prepare_d3 import main as step06


def main():
    print("=" * 60)
    print("SG Foreign Workers Data Pipeline")
    print("=" * 60)

    step01()
    print()
    step02()
    print()
    step03()
    print()
    step04()
    print()
    step05()
    print()
    step06()

    print()
    print("=" * 60)
    print("Pipeline complete. Check data/processed/ for outputs.")
    print("=" * 60)


if __name__ == "__main__":
    main()
