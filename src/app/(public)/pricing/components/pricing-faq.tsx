import { ChevronDown } from "lucide-react";

// Answers reflect decided product rules from the client Q&A, not invented
// copy — see docs/plans/Public-SuperAdmin-Plan.md §1 and §2.6.
const FAQS = [
  {
    q: "What happens if I go over my included seats?",
    a: "Every active-login user counts toward your seat limit — owners, admins, staff, and POS cashiers alike. Service/API accounts and read-only auditors don't. If you try to add a user beyond your plan's seat count, we block the creation and prompt you to upgrade — you'll never be silently overcharged.",
  },
  {
    q: "What happens if my subscription lapses?",
    a: "There's no grace period — your account moves to a read-only state immediately. You can still log in, view, and export your data, but can't create new transactions until payment is resolved. Full data deletion only happens after a much longer retention window (30–90 days), so nothing is lost right away.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes — upgrade or downgrade anytime as your team grows. Your seat count and active modules update immediately.",
  },
  {
    q: "Is my data secure?",
    a: "Every tenant's data is logically isolated from every other tenant. All sensitive credentials are encrypted, and every significant action is recorded in an audit log.",
  },
  {
    q: "Do you offer a free trial?",
    a: "Yes — every plan includes a free trial, no credit card required.",
  },
];

export function PricingFaq() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {FAQS.map((item, index) => (
        <details key={item.q} className="group p-5 xl:p-6 3xl:p-7" open={index === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13.5px] font-semibold text-text marker:content-none xl:text-[15px] 3xl:text-lg">
            {item.q}
            <ChevronDown className="size-4 shrink-0 text-text-4 transition-transform duration-200 group-open:rotate-180 xl:size-[18px] 3xl:size-5" />
          </summary>
          <p className="mt-3 text-[12.5px] leading-relaxed text-text-3 xl:text-sm 3xl:text-base">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
