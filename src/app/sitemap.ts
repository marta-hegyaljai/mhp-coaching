import type {MetadataRoute} from "next";

import {buildSitemapEntries} from "@/features/seo/sitemap-entries";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
