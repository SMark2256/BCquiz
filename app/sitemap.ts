import type { MetadataRoute } from "next";

const BASE_URL = "https://www.barcraft-corvin.hu";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
