import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/contact", "/privacy", "/terms"],
        disallow: [
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-otp",
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/api/",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
