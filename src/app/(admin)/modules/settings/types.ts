/* ------------------------------------------------------------------ */
/* Settings — domain model. Frontend-only mock (docs/Public-           */
/* SuperAdmin-Plan.md §3.5). First pass covers General, Legal &        */
/* Policies, and Social links; Notifications/Gateways/Platform-defaults */
/* tabs come later.                                                     */
/* ------------------------------------------------------------------ */

export type GeneralSettings = {
  platformName: string;
  /** Data URL of the uploaded logo image, or "" if none — no file-storage
   * backend yet, so this only lives in local state (see
   * src/config/platform-settings.ts). When empty, the navbar/footer fall
   * back to a letter mark derived from platformName. */
  logoUrl: string;
  tagline: string;
  /** Shown on the public /contact page. */
  contactEmail: string;
  /** Platform-wide — when enabled, the public site shows a maintenance
   * page instead of normal content. */
  maintenanceEnabled: boolean;
  maintenanceMessage: string;
};

export type LegalSettings = {
  /** Tiptap-authored HTML, rendered on /privacy and /terms. */
  privacyBody: string;
  termsBody: string;
  privacyLastUpdated: string;
  termsLastUpdated: string;
};

export type SocialLinks = {
  linkedin: string;
  twitter: string;
  instagram: string;
};

export type PlatformSettings = {
  general: GeneralSettings;
  legal: LegalSettings;
  socialLinks: SocialLinks;
};
