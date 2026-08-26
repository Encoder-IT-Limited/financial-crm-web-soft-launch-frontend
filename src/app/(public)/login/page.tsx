import Link from "next/link";
import { authPageMetadata } from "@/lib/seo";
import { AuthShell } from "../components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = authPageMetadata(
  "Log in",
  "Log in to your MRM Portal account to access your workspace."
);

export default function LoginPage() {
  return (
    <AuthShell>
      <h1 className="text-2xl font-extrabold text-text">Welcome back</h1>
      <p className="mt-1.5 text-[13px] text-text-3">Log in to your account to continue.</p>

      <LoginForm />

      <p className="mt-6 text-center text-[12.5px] text-text-3">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-blue hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
