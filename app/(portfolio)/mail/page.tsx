import { getOwner } from "@/lib/mail/owner";
import { listAccounts } from "@/lib/mail/jmap";
import { MailClient } from "./mail-client";
import { SignInPrompt } from "./signin-prompt";

export const dynamic = "force-dynamic";

export default async function MailHome(props: {
  searchParams: Promise<{ account?: string; folder?: string; email?: string }>;
}) {
  const owner = await getOwner();
  if (!owner) return <SignInPrompt />;
  const accounts = await listAccounts().catch(() => []);
  const sp = await props.searchParams;
  return (
    <MailClient
      owner={owner}
      accounts={accounts}
      initialAccount={sp.account}
      initialFolder={sp.folder}
      initialEmail={sp.email}
    />
  );
}
