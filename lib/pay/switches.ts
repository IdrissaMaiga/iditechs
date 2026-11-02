import { db } from '@/lib/db';
import { connectors, getConnector } from './connectors';
import type { Connector } from './connectors/types';

/**
 * The owner's on/off switch per provider, for every app at once (app_settings row `pay.providers.off`).
 * Off = no new payments with it. Payments already started still finish (webhooks and refresh keep working),
 * because the customer may already have paid.
 */
const KEY = 'pay.providers.off';
// Owner decision 2026-11-02: Orange Money and Wave stay off until their API access is set up
const DEFAULT_OFF = ['orange_money', 'wave'];

export async function switchedOff(): Promise<string[]> {
  const row = await db.appSetting.findUnique({ where: { key: KEY } });
  if (!row) return DEFAULT_OFF;
  try {
    const list = JSON.parse(row.value);
    return Array.isArray(list) ? list.map(String) : DEFAULT_OFF;
  } catch {
    return DEFAULT_OFF;
  }
}

export async function setSwitch(provider: string, on: boolean): Promise<string[]> {
  const off = new Set(await switchedOff());
  if (on) off.delete(provider);
  else off.add(provider);
  const value = JSON.stringify([...off].sort());
  await db.appSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  return [...off];
}

/** Providers an app may start a payment with: keys configured and switched on. */
export async function availableConnectors(): Promise<Connector[]> {
  const off = await switchedOff();
  return connectors.filter((c) => c.enabled() && !off.includes(c.id));
}

export async function isAvailable(provider: string): Promise<boolean> {
  const c = getConnector(provider);
  return Boolean(c?.enabled()) && !(await switchedOff()).includes(provider);
}
