#!/usr/bin/env node
/**
 * Debug script: check open-meteo API response and inspect
 * T0, T-12, T-24, T-48 values directly.
 *
 * Usage: node frontend/scripts/debug-weather.mjs [lat] [lon]
 * Default: Hanoi coordinates
 */

const lat = parseFloat(process.argv[2] ?? "21.0245");
const lon = parseFloat(process.argv[3] ?? "105.8412");

const apiUrl =
  `https://api.open-meteo.com/v1/forecast` +
  `?latitude=${lat}&longitude=${lon}` +
  `&current=temperature_2m,relative_humidity_2m,windspeed_10m,weather_code,shortwave_radiation` +
  `&minutely_15=temperature_2m,relative_humidity_2m,windspeed_10m,weather_code,shortwave_radiation` +
  `&past_minutely_15=192` +
  `&forecast_minutely_15=1` +
  `&timezone=Asia%2FHo_Chi_Minh`;

console.log("Fetching:", apiUrl, "\n");

const res = await fetch(apiUrl);
if (!res.ok) {
  console.error("HTTP error:", res.status, res.statusText);
  process.exit(1);
}
const json = await res.json();

// ── Current ──────────────────────────────────────────────────────────────────
const curTime        = json?.current?.time;
const curTemp        = json?.current?.temperature_2m;
const curWind        = json?.current?.windspeed_10m;
const curWeatherCode = json?.current?.weather_code;
const curHumidity    = json?.current?.relative_humidity_2m;
const curLight       = json?.current?.shortwave_radiation;

console.log("=== CURRENT (T0) ===");
console.log(`  time         : ${curTime}`);
console.log(`  temperature  : ${curTemp}`);
console.log(`  wind         : ${curWind}`);
console.log(`  weather_code : ${curWeatherCode}`);
console.log(`  humidity     : ${curHumidity}`);
console.log(`  radiation    : ${curLight}`);
console.log();

// ── Series ───────────────────────────────────────────────────────────────────
const seriesTimes    = json?.minutely_15?.time            ?? [];
const seriesTemps    = json?.minutely_15?.temperature_2m  ?? [];
const seriesWinds    = json?.minutely_15?.windspeed_10m   ?? [];
const seriesCodes    = json?.minutely_15?.weather_code    ?? [];
const seriesHumidity = json?.minutely_15?.relative_humidity_2m ?? [];
const seriesLight    = json?.minutely_15?.shortwave_radiation  ?? [];

console.log(`=== SERIES INFO ===`);
console.log(`  total points : ${seriesTimes.length}`);
console.log(`  first time   : ${seriesTimes[0]}`);
console.log(`  last  time   : ${seriesTimes[seriesTimes.length - 1]}`);
console.log();

// ── Resolve currentIndex (same logic as app) ──────────────────────────────────
function resolveCurrentIndex(times, currentWeatherTime) {
  if (!times.length) return 0;
  if (!currentWeatherTime) return Math.max(0, times.length - 1);
  const exact = times.indexOf(currentWeatherTime);
  if (exact >= 0) return exact;
  for (let i = times.length - 1; i >= 0; i--) {
    if (times[i] <= currentWeatherTime) return i;
  }
  return 0;
}

const currentIndex = resolveCurrentIndex(seriesTimes, curTime);
const t12Index     = Math.max(0, currentIndex - 48);   // 12h × 4 intervals/h
const t24Index     = Math.max(0, currentIndex - 96);   // 24h × 4
const t48Index     = Math.max(0, currentIndex - 192);  // 48h × 4

console.log(`=== INDEX RESOLUTION ===`);
console.log(`  currentIndex : ${currentIndex}  → time: ${seriesTimes[currentIndex]}`);
console.log(`  t12Index     : ${t12Index}  → time: ${seriesTimes[t12Index]}`);
console.log(`  t24Index     : ${t24Index}  → time: ${seriesTimes[t24Index]}`);
console.log(`  t48Index     : ${t48Index}  → time: ${seriesTimes[t48Index]}`);
console.log();

function row(label, idx) {
  return {
    label,
    time        : seriesTimes[idx]    ?? "N/A",
    temperature : seriesTemps[idx]    ?? "N/A",
    wind        : seriesWinds[idx]    ?? "N/A",
    weather_code: seriesCodes[idx]    ?? "N/A",
    humidity    : seriesHumidity[idx] ?? "N/A",
    light       : seriesLight[idx]    ?? "N/A",
  };
}

const rows = [
  row("T0  (current)", currentIndex),
  row("T-12          ", t12Index),
  row("T-24          ", t24Index),
  row("T-48          ", t48Index),
];

console.log("=== COMPARISON TABLE ===");
console.log(
  "Label".padEnd(18) +
  "Time".padEnd(20) +
  "Temp".padEnd(8) +
  "Wind".padEnd(8) +
  "WCode".padEnd(8) +
  "Humidity".padEnd(10) +
  "Light"
);
console.log("-".repeat(80));
for (const r of rows) {
  console.log(
    r.label.padEnd(18) +
    String(r.time).padEnd(20) +
    String(r.temperature).padEnd(8) +
    String(r.wind).padEnd(8) +
    String(r.weather_code).padEnd(8) +
    String(r.humidity).padEnd(10) +
    String(r.light)
  );
}

// ── Check if all codes are the same ──────────────────────────────────────────
const codeSet = new Set([
  seriesCodes[currentIndex],
  seriesCodes[t12Index],
  seriesCodes[t24Index],
  seriesCodes[t48Index],
]);
console.log();
if (codeSet.size === 1) {
  console.log("⚠️  All weather codes are IDENTICAL —", [...codeSet][0]);
  console.log("    Checking uniqueness in full series...");
  const uniqueCodes = new Set(seriesCodes);
  console.log(`    Unique codes in entire series: [${[...uniqueCodes].join(", ")}]`);
  if (uniqueCodes.size === 1) {
    console.log("    ❌ API returned the same weather_code for ALL 15-min intervals.");
    console.log("    → This is an API limitation: weather_code in minutely_15 is not always granular.");
  }
} else {
  console.log("✅  Weather codes differ across time points.");
}

// ── Sample first/last 5 entries in series codes ───────────────────────────────
console.log();
console.log("=== FIRST 5 weather_codes in series ===");
console.log(seriesCodes.slice(0, 5).map((c, i) => `  [${i}] ${seriesTimes[i]} → ${c}`).join("\n"));
console.log("=== LAST 5 weather_codes in series ===");
console.log(seriesCodes.slice(-5).map((c, i) => {
  const idx = seriesCodes.length - 5 + i;
  return `  [${idx}] ${seriesTimes[idx]} → ${c}`;
}).join("\n"));
