import type { Metadata } from "next";
import { getOwner } from "@/lib/mail/owner";
import { db } from "@/lib/db";
import { SignInPrompt } from "../mail/signin-prompt";
import { PhoneClient } from "./phone-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Phone notifications", robots: { index: false, follow: false } };

export default async function PhoneNotificationPage() {
  const owner = await getOwner();
  if (!owner) return <SignInPrompt />;
  const events = await db.phoneEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 200 });
  return (
    <PhoneClient
      initialEvents={events.map((e) => ({ ...e, receivedAt: e.receivedAt.toISOString(), createdAt: e.createdAt.toISOString() }))}
      webhookBase="https://idrissamaiga.iditechs.com/api/phone/incoming"
      configured={!!process.env.PHONE_WEBHOOK_SECRET}
    />
  );
}
