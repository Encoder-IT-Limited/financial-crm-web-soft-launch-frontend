// Single import point for toast notifications — components import this
// instead of "sonner" directly, matching the rest of src/lib/'s organization.
// Styling/icons/theming are configured once in components/ui/sonner.tsx.
export { toast } from "sonner";
