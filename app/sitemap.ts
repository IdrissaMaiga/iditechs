import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getAllPosts } from "@/lib/blog";
import { company, isCompanyHost } from "@/lib/company";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // iditechs.com serves a single page from this project, so it gets its own one-entry sitemap.
  if (isCompanyHost(headers().get("host"))) {
    return [{ url: company.site, lastModified: new Date(), changeFrequency: "monthly", priority: 1 }];
  }

  const baseUrl = "https://idrissamaiga.iditechs.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPosts();
    blogPages = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {}

  return [...staticPages, ...blogPages];
}
