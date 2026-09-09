import Image from "next/image";

import {organization} from "@/features/organization/info";
import {Eyebrow} from "@/shared/ui/layout";

export const CATALOGUE_INSTRUCTOR_IMAGE = "/images/courses/catalogue-instructor.webp";

export function CourseCatalogueLead({
  eyebrow,
  title,
  intro,
  courseCount,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  courseCount: string;
}) {
  return (
    <>
      <Eyebrow className="max-lg:text-gold">{eyebrow}</Eyebrow>
      <h1 className="mt-3 font-serif text-heading text-parchment lg:mt-4 lg:text-title lg:text-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-parchment/85 lg:mt-4 lg:text-base lg:leading-7 lg:text-ink-muted">
        {intro}
      </p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-parchment/70 lg:mt-5 lg:text-ink-subtle">
        {courseCount}
      </p>
    </>
  );
}

export function CourseCataloguePortrait({imageAlt}: {imageAlt: string}) {
  return (
    <figure className="flex h-full flex-col">
      <div className="relative min-h-[22rem] flex-1 overflow-hidden border border-ink">
        <Image
          src={CATALOGUE_INSTRUCTOR_IMAGE}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1280px) 320px, 288px"
          className="object-cover object-[62%_18%]"
        />
      </div>
      <figcaption className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
        {organization.founder}
      </figcaption>
    </figure>
  );
}
