import { LegalPage, buildLegalMetadata } from "../../legal-page";

export const metadata = buildLegalMetadata("en", "privacy");

export default function Page() {
  return <LegalPage lang="en" kind="privacy" />;
}
