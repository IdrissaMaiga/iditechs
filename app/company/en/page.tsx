import { CompanyPage, buildMetadata } from "../company-page";

export const metadata = buildMetadata("en");

export default function Page() {
  return <CompanyPage lang="en" />;
}
