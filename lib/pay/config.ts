const orangeCountry = process.env.ORANGE_COUNTRY ?? 'dev';

export const payConfig = {
  // Public base of the pay API, used in the callback URLs given to the providers
  publicUrl: (process.env.PAY_PUBLIC_URL ?? 'https://iditechs.com/api/pay').replace(/\/$/, ''),
  orange: {
    clientId: process.env.ORANGE_CLIENT_ID ?? '',
    clientSecret: process.env.ORANGE_CLIENT_SECRET ?? '',
    merchantKey: process.env.ORANGE_MERCHANT_KEY ?? '',
    country: orangeCountry,
    // The sandbox only accepts its test currency OUV
    currency: process.env.ORANGE_CURRENCY ?? (orangeCountry === 'dev' ? 'OUV' : 'XOF'),
    reference: process.env.ORANGE_REFERENCE ?? 'IDITECHS',
    apiBase: process.env.ORANGE_API_BASE ?? 'https://api.orange.com',
  },
  wave: {
    apiKey: process.env.WAVE_API_KEY ?? '',
    webhookSecret: process.env.WAVE_WEBHOOK_SECRET ?? '',
    apiBase: process.env.WAVE_API_BASE ?? 'https://api.wave.com',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    apiBase: process.env.STRIPE_API_BASE ?? 'https://api.stripe.com',
  },
  // Each app may create at most this many payments per minute, and ask the provider for a payment's status at most
  // once per this many seconds: the Stripe rate limit is shared with AgentiCareer and the back office
  limits: { paymentsPerMinute: 30, refreshSeconds: 10 },
  // App notifications: after the n-th failure wait 30s * 2^(n-1), so 8 attempts span about an hour
  delivery: { maxAttempts: 8, baseDelaySeconds: 30, timeoutMs: 10_000 },
};
