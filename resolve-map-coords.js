/**
 * resolve-map-coords.js
 *
 * Resolves each Google Maps short link in the source linktree export to a
 * lat/lng pair, by letting a real browser follow the redirect and reading
 * the coordinates out of the resulting URL.
 *
 * Usage:
 *   npm install puppeteer
 *   node resolve-map-coords.js ./data.json ./map-coords-results.json
 *
 * Input:  the linktree export ({ links: [{ id, title, url, ... }, ...] })
 * Output: a JSON array of { id, title, url, lat, lng, finalUrl, error }
 *         — review this file before writing anything back to Mongo.
 *
 * This does NOT touch the database. It only produces a results file.
 * A second, separate step should map `id` -> `legacyId` on sales_points
 * and write lat/lng after you've spot-checked the results.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const [, , inputPath = './data.json', outputPath = './map-coords-results.json'] = process.argv;

const COORD_REGEX = /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/;
// Fallback pattern sometimes present in embedded page data even when the
// URL itself doesn't carry an @lat,lng (e.g. certain place-card redirects).
const DATA_COORD_REGEX = /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/;

async function resolveOne(browser, link) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    );
    await page.goto(link.url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Google Maps often does a client-side redirect after the initial load —
    // give it a moment to settle before reading the final URL.
    await new Promise((r) => setTimeout(r, 2500));

    const finalUrl = page.url();
    let match = finalUrl.match(COORD_REGEX);

    if (!match) {
      // fall back to scanning the raw page content for embedded coordinates
      const content = await page.content();
      match = content.match(DATA_COORD_REGEX);
    }

    if (match) {
      return {
        id: link.id,
        title: link.title,
        url: link.url,
        lat: parseFloat(match[1]),
        lng: parseFloat(match[2]),
        finalUrl,
        error: null,
      };
    }

    return {
      id: link.id,
      title: link.title,
      url: link.url,
      lat: null,
      lng: null,
      finalUrl,
      error: 'coordinates not found in URL or page content',
    };
  } catch (err) {
    return {
      id: link.id,
      title: link.title,
      url: link.url,
      lat: null,
      lng: null,
      finalUrl: null,
      error: err.message,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const links = source.links || source; // tolerate either shape

  // NOTE: added executablePath (via env, falls back to bundled Chromium) and
  // --no-sandbox args so the script also runs in container/CI environments.
  // On a normal laptop these are no-ops; PUPPETEER_EXECUTABLE_PATH overrides
  // the browser binary when the bundled Chromium isn't downloaded.
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const results = [];

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    process.stdout.write(`[${i + 1}/${links.length}] ${link.id} — ${link.title} ... `);
    const result = await resolveOne(browser, link);
    console.log(result.lat !== null ? `OK (${result.lat}, ${result.lng})` : `FAILED: ${result.error}`);
    results.push(result);

    // Rate-limit: avoid hammering Google and getting temporarily blocked.
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000));
  }

  await browser.close();
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  const failed = results.filter((r) => r.lat === null);
  console.log(`\nDone. ${results.length - failed.length}/${results.length} resolved.`);
  if (failed.length) {
    console.log(`${failed.length} failed — see "${outputPath}" for details, retry those manually.`);
  }
}

main();
