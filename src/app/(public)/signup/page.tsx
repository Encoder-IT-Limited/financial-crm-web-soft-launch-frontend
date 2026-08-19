import { SignupFlow } from "./signup-flow";

export default async function SignupPage(props: PageProps<"/signup">) {
  const searchParams = await props.searchParams;
  const planParam = typeof searchParams.plan === "string" ? searchParams.plan : undefined;

  return <SignupFlow initialPlanId={planParam} />;
}
