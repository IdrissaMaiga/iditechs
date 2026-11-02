import type { Metadata } from "next";
import { getOwner } from "@/lib/mail/owner";
import { PayClient } from "./pay-client";
import { SignInPrompt } from "../mail/signin-prompt";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "IDITECHS Pay", robots: { index: false, follow: false } };

export default async function PayPage() {
  const owner = await getOwner();
  if (!owner) return <SignInPrompt />;
  return <PayClient />;
}
