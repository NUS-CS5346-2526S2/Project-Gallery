#!/usr/bin/env node
/**
 * Downloads UN DESA International Migrant Stock 2020 (Table 1) and emits
 * a cleaned migration.json for the Singapore destination.
 *
 * Note: we use the 2020 release rather than 2024 because the 2024 release
 * only itemises 10 origins for Singapore (China, HK, Taiwan, India,
 * Indonesia, Malaysia, USA, Canada, Australia, NZ) and folds Philippines,
 * Bangladesh, Pakistan, Thailand, etc. into a single "Others" aggregate.
 * The 2020 release itemises 15 country origins for Singapore including all
 * of the above. We lose the 2024 snapshot but keep 1990→2020 (7 snapshots).
 *
 * Usage: node scripts/prep_data.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_URL =
  'https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/undesa_pd_2020_ims_stock_by_sex_destination_and_origin.xlsx';
const CACHE_PATH = path.join(ROOT, '.cache', 'undesa_ims_2020.xlsx');
const OUT_PATH = path.join(ROOT, 'public', 'migration.json');

const YEARS = [1990, 1995, 2000, 2005, 2010, 2015, 2020];
// Table 1 header row index 10 (0-based). Columns:
// 0 Index, 1 destination, 2 notes, 3 loc code dest, 4 data type,
// 5 origin, 6 loc code origin, 7..13 both-sexes stocks for YEARS
const STOCK_START_COL = 7;
const SG_DEST_CODE = 702;

// Hard-coded centroids (lon, lat) for the country origins the UN itemises for
// Singapore in the 2020 release. Keyed by UN M49 location code.
const CENTROIDS = {
  50:  { name: 'Bangladesh', iso3: 'BGD', continent: 'Asia', lon: 90.3563, lat: 23.685 },
  156: { name: 'China', iso3: 'CHN', continent: 'Asia', lon: 104.1954, lat: 35.8617 },
  344: { name: 'Hong Kong SAR', iso3: 'HKG', continent: 'Asia', lon: 114.1694, lat: 22.3193 },
  446: { name: 'Macao SAR', iso3: 'MAC', continent: 'Asia', lon: 113.5439, lat: 22.1987 },
  356: { name: 'India', iso3: 'IND', continent: 'Asia', lon: 78.9629, lat: 20.5937 },
  144: { name: 'Sri Lanka', iso3: 'LKA', continent: 'Asia', lon: 80.7718, lat: 7.8731 },
  360: { name: 'Indonesia', iso3: 'IDN', continent: 'Asia', lon: 113.9213, lat: -0.7893 },
  458: { name: 'Malaysia', iso3: 'MYS', continent: 'Asia', lon: 101.9758, lat: 4.2105 },
  586: { name: 'Pakistan', iso3: 'PAK', continent: 'Asia', lon: 69.3451, lat: 30.3753 },
  608: { name: 'Philippines', iso3: 'PHL', continent: 'Asia', lon: 121.774, lat: 12.8797 },
  764: { name: 'Thailand', iso3: 'THA', continent: 'Asia', lon: 100.9925, lat: 15.87 },
  840: { name: 'United States', iso3: 'USA', continent: 'Americas', lon: -95.7129, lat: 37.0902 },
  124: { name: 'Canada', iso3: 'CAN', continent: 'Americas', lon: -106.3468, lat: 56.1304 },
  36:  { name: 'Australia', iso3: 'AUS', continent: 'Oceania', lon: 133.7751, lat: -25.2744 },
  554: { name: 'New Zealand', iso3: 'NZL', continent: 'Oceania', lon: 174.886, lat: -40.9006 },
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const out = fs.createWriteStream(dest);
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          out.close();
          fs.unlinkSync(dest);
          resolve(download(res.headers.location, dest));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        res.pipe(out);
        out.on('finish', () => out.close(() => resolve(dest)));
      },
    );
    req.on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(CACHE_PATH)) {
    console.log('Downloading UN DESA IMS 2020 xlsx...');
    await download(DATA_URL, CACHE_PATH);
  } else {
    console.log('Using cached xlsx at', CACHE_PATH);
  }

  const wb = XLSX.readFile(CACHE_PATH);
  if (!wb.SheetNames.includes('Table 1')) {
    throw new Error(`Expected 'Table 1' sheet. Found: ${wb.SheetNames.join(', ')}`);
  }
  const rows = XLSX.utils.sheet_to_json(wb.Sheets['Table 1'], {
    header: 1,
    raw: true,
  });

  // Sanity-check the header row (row index 10 per inspection).
  const header = rows[10];
  if (!header || header[1] !== 'Region, development group, country or area of destination') {
    throw new Error(
      `Unexpected Table 1 header layout. Row 10: ${JSON.stringify(header).slice(0, 200)}`,
    );
  }
  for (let i = 0; i < YEARS.length; i++) {
    if (header[STOCK_START_COL + i] !== YEARS[i]) {
      throw new Error(
        `Expected year ${YEARS[i]} at column ${STOCK_START_COL + i}, got ${header[STOCK_START_COL + i]}`,
      );
    }
  }

  const sgRows = rows.filter((r) => r && r[3] === SG_DEST_CODE);
  if (sgRows.length === 0) {
    throw new Error(`No rows found with destination loc code ${SG_DEST_CODE} (Singapore).`);
  }
  console.log(`Found ${sgRows.length} Singapore-destination rows.`);

  const countries = [];
  for (const r of sgRows) {
    const code = r[6];
    const centroid = CENTROIDS[code];
    if (!centroid) continue; // skip regions/aggregates
    const stock = [];
    for (let i = 0; i < YEARS.length; i++) {
      const v = r[STOCK_START_COL + i];
      stock.push(typeof v === 'number' ? v : 0);
    }
    const maxStock = Math.max(...stock);
    if (maxStock < 1000) continue;
    const delta = stock.map((v, i) => (i === 0 ? null : v - stock[i - 1]));
    countries.push({ m49: code, ...centroid, stock, delta });
  }

  // Sanity: Malaysia should have sizable, monotonically growing stock.
  const mys = countries.find((c) => c.iso3 === 'MYS');
  if (!mys) throw new Error('Malaysia missing from Singapore origins.');
  if (mys.stock[0] < 100_000 || mys.stock.at(-1) < mys.stock[0] * 2) {
    throw new Error(`Malaysia sanity check failed. Stock: ${JSON.stringify(mys.stock)}`);
  }
  // Sanity: Philippines should be present (this is the whole reason we switched to 2020).
  const phl = countries.find((c) => c.iso3 === 'PHL');
  if (!phl) throw new Error('Philippines missing from Singapore origins (expected in 2020 release).');
  console.log(`Malaysia stock: ${mys.stock.join(', ')} ✓`);
  console.log(`Philippines stock: ${phl.stock.join(', ')} ✓`);
  console.log(`Emitting ${countries.length} origin countries.`);

  const out = { years: YEARS, singapore: { lon: 103.8198, lat: 1.3521 }, countries };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log('Wrote', OUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
