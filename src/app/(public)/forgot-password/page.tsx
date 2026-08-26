import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { authPageMetadata } from "@/lib/seo";
import { AuthShell } from "../components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = authPageMetadata(
  "Forgot password",
  "Request a verification code to reset your MRM Portal password."
);

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Link
        href="/login"
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-text-3 hover:text-text"
      >
        <ArrowLeft className="size-3.5" />
        Back to log in
      </Link>

      <h1 className="text-2xl font-extrabold text-text">Forgot your password?</h1>
      <p className="mt-1.5 text-[13px] text-text-3">
        Enter your email and we&apos;ll send you a verification code.
      </p>

      <ForgotPasswordForm />
    </AuthShell>
  );
}
