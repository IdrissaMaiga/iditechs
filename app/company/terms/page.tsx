import { LegalPage, buildLegalMetadata } from "../legal-page";

export const metadata = buildLegalMetadata("fr", "terms");

export default function Page() {
  return <LegalPage lang="fr" kind="terms" />;
}
