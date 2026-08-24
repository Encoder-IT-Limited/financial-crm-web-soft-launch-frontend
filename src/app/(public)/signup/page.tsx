import { authPageMetadata } from "@/lib/seo";
import { SignupFlow } from "./signup-flow";

export const metadata = authPageMetadata(
  "Sign up",
  "Create your MRM Portal workspace — choose a plan and start a 14-day free trial."
);

export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  const planParam = typeof searchParams.plan === "string" ? searchParams.plan : undefined;

  return <SignupFlow initialPlanId={planParam} />;
}
