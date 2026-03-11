#!/usr/bin/env node
/**
 * Generates PWA icons for the admin dashboard from the DAKSHH logo.
 * Run from project root: node scripts/generate_admin_pwa_icons.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGO_URL =
  "https://res.cloudinary.com/dpfpsdkfn/image/upload/v1772632654/dakshh_t0ifux.png";
const SIZES = [192, 512];
const OUT_DIR = join(__dirname, "..", "client", "public", "x7k9p2");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const size of SIZES) {
    const url = `https://res.cloudinary.com/dpfpsdkfn/image/upload/w_${size},h_${size},c_fit/v1772632654/dakshh_t0ifux.png`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${size}x${size}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const outPath = join(OUT_DIR, `icon-${size}x${size}.png`);
    await writeFile(outPath, buf);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
