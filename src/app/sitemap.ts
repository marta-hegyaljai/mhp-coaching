import type {MetadataRoute} from "next";

import {buildSitemapEntries} from "@/features/seo/sitemap-entries";
import {loadPublishedCourses} from "@/features/courses/live";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries(await loadPublishedCourses());
}
