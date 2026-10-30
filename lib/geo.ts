import maxmind, { type CountryResponse, type Reader } from "maxmind";

// IP -> ISO country code from a local DB-IP "IP to Country Lite" database (CC BY 4.0,
// https://db-ip.com). On VPS2 the file lives in /opt/iditechs-web/geo, mounted read-only at
// /geo and refreshed monthly by /etc/cron.monthly/iditechs-geoip. No IP leaves the server.
const DB_PATH = process.env.GEOIP_DB || "/geo/country.mmdb";
const RETRY_MS = 10 * 60_000;

let reader: Reader<CountryResponse> | null = null;
let failedAt = 0;

async function open(): Promise<Reader<CountryResponse> | null> {
  if (reader) return reader;
  if (failedAt && Date.now() - failedAt < RETRY_MS) return null;
  try {
    // watchForUpdates picks up the monthly refresh without a restart
    reader = await maxmind.open<CountryResponse>(DB_PATH, { watchForUpdates: true, watchForUpdatesNonPersistent: true });
    return reader;
  } catch {
    failedAt = Date.now();
    return null;
  }
}

/** Two-letter country code (e.g. "ML"), or null when unknown or the database is missing. */
export async function countryOf(ip: string | null | undefined): Promise<string | null> {
  if (!ip || !maxmind.validate(ip)) return null;
  const r = await open();
  return r?.get(ip)?.country?.iso_code ?? null;
}
