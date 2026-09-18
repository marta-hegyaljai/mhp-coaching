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
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-2 font-serif text-heading text-ink lg:mt-3 lg:text-title">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted max-sm:hidden lg:mt-3 lg:text-base lg:leading-7">
        {intro}
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink-subtle lg:mt-3">
        {courseCount}
      </p>
    </>
  );
}

export function CourseCataloguePortrait({imageAlt}: {imageAlt: string}) {
  return (
    <figure className="relative">
      <div className="relative aspect-square overflow-hidden border border-ink lg:aspect-[3/2]">
        <Image
          src={CATALOGUE_INSTRUCTOR_IMAGE}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 352px, (min-width: 640px) 224px, 160px"
          className="object-cover object-[60%_center] max-lg:scale-110"
        />
      </div>
      <figcaption className="absolute bottom-px left-px max-w-[calc(100%-2px)] border-r border-t border-ink bg-white px-2 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-ink-subtle sm:px-3 sm:text-[0.65rem] sm:tracking-[0.14em]">
        {organization.founder}
      </figcaption>
    </figure>
  );
}
