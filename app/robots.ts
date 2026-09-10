import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isCompanyHost } from "@/lib/company";

export default function robots(): MetadataRoute.Robots {
  if (isCompanyHost(headers().get("host"))) {
    return {
      rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
      sitemap: "https://iditechs.com/sitemap.xml",
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/stats/"],
      },
    ],
    sitemap: "https://idrissamaiga.iditechs.com/sitemap.xml",
  };
}
