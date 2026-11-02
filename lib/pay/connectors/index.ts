import { orangeMoney } from './orange';
import { stripe } from './stripe';
import type { Connector } from './types';
import { wave } from './wave';

// To add a provider (Moov Money, PayDunya...): write a Connector and list it here. Apps need no change.
export const connectors: Connector[] = [orangeMoney, wave, stripe];

export function getConnector(id: string): Connector | undefined {
  return connectors.find((c) => c.id === id);
}
