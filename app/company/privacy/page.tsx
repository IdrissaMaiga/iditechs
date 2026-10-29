import { LegalPage, buildLegalMetadata } from "../legal-page";

export const metadata = buildLegalMetadata("fr", "privacy");

export default function Page() {
  return <LegalPage lang="fr" kind="privacy" />;
}
