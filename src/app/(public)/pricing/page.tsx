import Link from "next/link";

const plans = [
  { name: "Starter", price: "AED 199", seats: "3 seats included", popular: false },
  { name: "Growth", price: "AED 499", seats: "10 seats included", popular: true },
  { name: "Enterprise", price: "Custom", seats: "Unlimited seats", popular: false },
];

export default function PricingPage() {
  return (
    <main className="flex-1 px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Plans & pricing</h1>
        <p className="mt-2 text-[13px] text-text-3">
          Every plan includes the full accounting core. Add seats as your team grows.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-5 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className="relative rounded-2xl border-2 border-border bg-surface p-6 text-center transition-colors hover:border-blue"
          >
            {plan.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue px-3 py-0.5 text-[10px] font-bold text-white">
                Most popular
              </span>
            )}
            <div className="text-sm font-bold text-text">{plan.name}</div>
            <div className="mt-2 text-2xl font-extrabold text-text">{plan.price}</div>
            <div className="mt-1 text-[11px] text-text-4">{plan.seats}</div>
            <Link
              href="/login"
              className="mt-5 block rounded-lg bg-blue px-4 py-2 text-[12.5px] font-semibold text-white hover:brightness-110"
            >
              Choose {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
