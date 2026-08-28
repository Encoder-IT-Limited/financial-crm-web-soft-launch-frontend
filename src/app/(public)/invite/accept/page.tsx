import { authPageMetadata } from "@/lib/seo";
import { AuthShell } from "../../components/auth-shell";
import { AcceptInviteForm } from "./accept-invite-form";

export const metadata = authPageMetadata(
  "Accept invite",
  "Activate your invited MRM Portal account."
);

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <AuthShell>
      <AcceptInviteForm token={token} />
    </AuthShell>
  );
}
