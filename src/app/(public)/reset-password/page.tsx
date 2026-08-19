import { AuthShell } from "../components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

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
