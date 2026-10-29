import { LegalPage, buildLegalMetadata } from "../../legal-page";

export const metadata = buildLegalMetadata("en", "terms");

export default function Page() {
  return <LegalPage lang="en" kind="terms" />;
}
