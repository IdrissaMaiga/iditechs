import { CompanyPage, buildMetadata } from "./company-page";

export const metadata = buildMetadata("fr");

export default function Page() {
  return <CompanyPage lang="fr" />;
}
