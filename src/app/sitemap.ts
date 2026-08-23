import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// One public URL today. Add entries here as public pages land.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
