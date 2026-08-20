import { Mail } from "lucide-react";
import { PLATFORM_SETTINGS } from "@/config/platform-settings";
import { ContactForm } from "./contact-form";

export default function ContactPage() {
  return (
    <main className="flex min-h-[90vh] flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid w-full max-w-4xl gap-10 sm:grid-cols-[1fr_1.4fr] sm:items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-text sm:text-3xl">Get in touch</h1>
          <p className="mt-3 text-[13.5px] text-text-3">
            Questions about plans, modules, or your account — send us a message and we&apos;ll
            get back to you.
          </p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex size-9 items-center justify-center rounded-lg bg-blue-l text-blue">
              <Mail className="size-4" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-text-4 uppercase">Email</div>
              <div className="text-[13px] font-medium text-text">{PLATFORM_SETTINGS.general.contactEmail}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
