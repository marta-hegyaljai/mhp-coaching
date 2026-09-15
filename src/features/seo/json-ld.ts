import {founderAlumni, founderPortrait, founderSameAs} from "@/features/about/founder";
import type {AppLocale} from "@/i18n/routing";
import {getSiteUrl} from "@/lib/site-url";
import {organization} from "@/features/organization/info";
import {toIsoDateTime} from "@/features/courses/dates";
import {getBookableDates} from "@/features/courses/queries";
import {isSupervisionCourse, type Course} from "@/features/courses/types";
import {
  homeStatue,
  homeStatueAlt,
  homeStatueArtist,
  homeStatueTitle,
} from "./home-statue";
import {localizedPath} from "./metadata";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  const site = getSiteUrl().origin;
  const office = organization.addresses.headquarters;

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${site}/#organization`,
    name: organization.brandName,
    legalName: organization.legalName,
    url: site,
    email: organization.email,
    telephone: organization.phone,
    founder: {
      "@type": "Person",
      "@id": `${site}/#marta-hegyaljai-python`,
      name: organization.founder,
    },
    sameAs: [...founderSameAs],
    address: {
      "@type": "PostalAddress",
      streetAddress: office.street,
      postalCode: office.postalCode,
      addressLocality: office.city,
      addressRegion: office.region,
      addressCountry: office.country,
    },
  };
}

export function founderPersonJsonLd(input: {
  locale: AppLocale;
  jobTitle: string;
  description: string;
  awards: string[];
  pagePath: string;
}): JsonLd {
  const site = getSiteUrl().origin;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${site}/#marta-hegyaljai-python`,
        name: organization.founder,
        inLanguage: input.locale,
        jobTitle: input.jobTitle,
        description: input.description,
        image: `${site}${founderPortrait.src}`,
        url: `${site}${input.pagePath}`,
        worksFor: {"@id": `${site}/#organization`},
        alumniOf: founderAlumni.map((name) => ({
          "@type": "CollegeOrUniversity",
          name,
        })),
        award: input.awards,
        sameAs: [...founderSameAs],
      },
      {
        "@type": "EducationalOrganization",
        "@id": `${site}/#organization`,
        name: organization.brandName,
        legalName: organization.legalName,
        url: site,
        founder: {"@id": `${site}/#marta-hegyaljai-python`},
        sameAs: [...founderSameAs],
      },
    ],
  };
}

export function websiteJsonLd(locale: AppLocale): JsonLd {
  const site = getSiteUrl().origin;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: organization.brandName,
    url: site,
    inLanguage: locale,
    publisher: {"@id": `${site}/#organization`},
  };
}

export function courseListJsonLd(
  courses: Course[],
  locale: AppLocale,
): JsonLd {
  const site = getSiteUrl().origin;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courses.map((course, index) => {
      const path = localizedPath(locale, {
        pathname: "/courses/[slug]",
        params: {slug: course.slug[locale]},
      });

      return {
        "@type": "ListItem",
        position: index + 1,
        name: course.title[locale],
        url: `${site}${path}`,
      };
    }),
  };
}

export function breadcrumbJsonLd(
  items: Array<{name: string; path: string}>,
): JsonLd {
  const site = getSiteUrl().origin;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${site}${item.path}`,
    })),
  };
}

export function courseJsonLd(course: Course, locale: AppLocale): JsonLd {
  const site = getSiteUrl().origin;
  const path = localizedPath(locale, {
    pathname: "/courses/[slug]",
    params: {slug: course.slug[locale]},
  });

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title[locale],
    description: course.shortDescription[locale],
    url: `${site}${path}`,
    inLanguage: locale,
    provider: {"@id": `${site}/#organization`},
    offers: {
      "@type": "Offer",
      price: course.priceChf.toFixed(2),
      priceCurrency: "CHF",
      availability: "https://schema.org/InStock",
      url: `${site}${path}`,
    },
    hasCourseInstance: getBookableDates(course).map((date) => ({
        "@type": "CourseInstance",
        name: course.title[locale],
        startDate: toIsoDateTime(date.startDate),
        endDate: toIsoDateTime(date.endDate ?? date.startDate),
        ...courseInstanceLocation(course, date, locale),
      })),
  };
}

export function homeStatueJsonLd(locale: AppLocale): JsonLd {
  const site = getSiteUrl().origin;
  const alt = homeStatueAlt[locale];

  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: `${site}${homeStatue.src}`,
    url: `${site}${homeStatue.src}`,
    name: homeStatueTitle,
    description: alt,
    encodingFormat: "image/webp",
    width: homeStatue.width,
    height: homeStatue.height,
    inLanguage: locale,
    representativeOfPage: true,
    creditText: `${homeStatueTitle} — ${homeStatueArtist}`,
    creator: {
      "@type": "Person",
      name: homeStatueArtist,
    },
    copyrightHolder: {"@id": `${site}/#organization`},
  };
}

export function eventJsonLd(course: Course, locale: AppLocale): JsonLd[] {
  const site = getSiteUrl().origin;
  const coursePath = localizedPath(locale, {
    pathname: "/courses/[slug]",
    params: {slug: course.slug[locale]},
  });
  const bookPath = localizedPath(locale, {
    pathname: "/courses/[slug]/book",
    params: {slug: course.slug[locale]},
  });

  return getBookableDates(course)
    .map((date) => ({
      "@context": "https://schema.org",
      "@type": "Event",
      name: `${course.title[locale]} — ${date.location[locale]}`,
      description: course.shortDescription[locale],
      startDate: toIsoDateTime(date.startDate),
      endDate: toIsoDateTime(date.endDate ?? date.startDate),
      eventAttendanceMode: isSupervisionCourse(course)
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      ...eventLocation(course, date, locale),
      organizer: {"@id": `${site}/#organization`},
      offers: {
        "@type": "Offer",
        price: course.priceChf.toFixed(2),
        priceCurrency: "CHF",
        availability: "https://schema.org/InStock",
        url: `${site}${bookPath}`,
      },
      url: `${site}${coursePath}`,
    }));
}

function courseInstanceLocation(
  course: Course,
  date: Course["dates"][number],
  locale: AppLocale,
) {
  if (isSupervisionCourse(course)) {
    return {
      location: {
        "@type": "VirtualLocation",
        name: date.location[locale],
      },
    };
  }

  return {
    location: {
      "@type": "Place",
      name: date.location[locale],
      address: date.venue?.[locale],
    },
  };
}

function eventLocation(
  course: Course,
  date: Course["dates"][number],
  locale: AppLocale,
) {
  return courseInstanceLocation(course, date, locale);
}
