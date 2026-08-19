export type FeatureCategory = {
  title: string;
  description: string;
  moduleKeys: string[];
};

// Groups modules-data.ts's flat MODULES list into sections for /features.
export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    title: "Finance & Accounting",
    description: "The books, invoicing, and compliance reporting, all connected.",
    moduleKeys: ["accounting", "invoicing", "expenses", "banking", "reports"],
  },
  {
    title: "Sales, Inventory & Operations",
    description: "From a lead, to a sale, to what's left on the shelf.",
    moduleKeys: ["crm", "inventory", "pos"],
  },
  {
    title: "People & Scheduling",
    description: "Your team and your calendar, managed in the same place.",
    moduleKeys: ["hr-payroll", "calendar-booking"],
  },
  {
    title: "Intelligence & Marketing",
    description: "AI that does the busywork, and a presence beyond the platform.",
    moduleKeys: ["ai-assistant", "social-media"],
  },
];
