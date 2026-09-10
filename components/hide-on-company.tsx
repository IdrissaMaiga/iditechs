"use client";

import { usePathname } from "next/navigation";

// The company site (iditechs.com -> /company) must not show the portfolio navbar or the AI chat.
export default function HideOnCompany({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/company")) return null;
  return <>{children}</>;
}
