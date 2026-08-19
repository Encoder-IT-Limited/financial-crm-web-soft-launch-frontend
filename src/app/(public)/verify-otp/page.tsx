import { AuthShell } from "../components/auth-shell";
import { VerifyOtpForm } from "./verify-otp-form";

export default async function VerifyOtpPage(props: PageProps<"/verify-otp">) {
  const searchParams = await props.searchParams;
  const email = typeof searchParams.email === "string" ? searchParams.email : "";

  return (
    <AuthShell>
      <VerifyOtpForm email={email} />
    </AuthShell>
  );
}
