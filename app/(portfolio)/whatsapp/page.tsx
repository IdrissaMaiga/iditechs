import { getOwner } from "@/lib/mail/owner";
import { db } from "@/lib/db";
import { WaClient } from "./wa-client";
import { SignInPrompt } from "../mail/signin-prompt";

export const dynamic = "force-dynamic";

export default async function WhatsAppPage() {
  const owner = await getOwner();
  if (!owner) return <SignInPrompt />;
  const raw = await db.waInstance.findMany({ orderBy: { createdAt: "desc" } });
  const instances = raw.map((i) => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() }));
  return <WaClient initialInstances={instances} />;
}
