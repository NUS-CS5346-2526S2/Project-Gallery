## `migration_data.xlsx`

This app loads the workbook at runtime from:

- `public/data/migration_data.xlsx` → served relative to the project page as `./data/migration_data.xlsx`

If you see a Vercel error like `Failed to load workbook ... (404)`, it means this file is missing
from the deployment output.

