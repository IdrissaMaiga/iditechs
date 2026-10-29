// Legal identity of the business. The company page, the portfolio footer and the structured
// data all read from this object.
export const company = {
  brand: "IDITECHS",
  legalForm: "Entreprise Individuelle",
  owner: "Idrissa Maiga",
  rccm: "ML-BKO-01-2026-A-05533",
  nif: "085146824W" as string | null,
  duns: "850426492",
  address: "Kalabancoura, Commune V, Bamako, Mali",
  phones: ["+223 77 37 47 82", "+223 84 02 71 37"],
  whatsapp: "22377374782",
  email: "contact@iditechs.com",
  site: "https://iditechs.com",
  portfolio: "https://idrissamaiga.iditechs.com",
};

export const socials = [
  { name: "Instagram", handle: "@iditechs", url: "https://www.instagram.com/iditechs/" },
  { name: "TikTok", handle: "@iditechs", url: "https://www.tiktok.com/@iditechs" },
  { name: "X", handle: "@Iditechs", url: "https://x.com/Iditechs" },
  { name: "YouTube", handle: "@Iditechs", url: "https://www.youtube.com/@Iditechs" },
  { name: "Facebook", handle: "IDiTechs", url: "https://www.facebook.com/Iditechs" },
  { name: "LinkedIn", handle: "IDiTechs", url: "https://www.linkedin.com/company/126673993" },
] as const;

export type SocialName = (typeof socials)[number]["name"];

const companyHosts = new Set(["iditechs.com", "www.iditechs.com"]);

export function isCompanyHost(host: string | null | undefined) {
  return companyHosts.has((host ?? "").split(":")[0].toLowerCase());
}

export function legalLine(lang: "fr" | "en" = "fr") {
  const nif = company.nif
    ? `NIF ${company.nif}`
    : lang === "fr"
      ? "NIF : en cours d'attribution"
      : "NIF: pending";
  return `${company.brand} · ${company.legalForm} · RCCM ${company.rccm} · ${nif} · ${company.address}`;
}
