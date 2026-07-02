import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";

export const dynamic = "force-static";

const BASE = "https://green-starsolutions.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE}/portfolio/`, changeFrequency: "monthly", priority: 0.9 },
    ...projects.map((p) => ({
      url: `${BASE}/portfolio/${p.slug}/`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
