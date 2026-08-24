import { authPageMetadata } from "@/lib/seo";
import { AuthShell } from "../components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = authPageMetadata(
  "Reset password",
  "Choose a new password for your MRM Portal account."
);

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";
  const otp = typeof searchParams.otp === "string" ? searchParams.otp : "";

  return (
    <AuthShell>
      <ResetPasswordForm email={email} otp={otp} />
    </AuthShell>
  );
}
