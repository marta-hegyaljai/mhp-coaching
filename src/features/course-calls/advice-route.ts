import type {PathnameHref} from "@/i18n/href";
import {isIsoDate} from "@/shared/ui/date-field-calendar";

export type AdviceMode = "call" | "write";

export type AdviceQuery = {
  mode: AdviceMode;
  date?: string;
};

/**
 * Advice is offered from two places with identical booking rules: a course
 * page, which records which course prompted the call, and the standalone page,
 * which records none. The target is the only difference between them.
 */
export type AdviceTarget = {kind: "course"; slug: string} | {kind: "general"};

export const generalAdvice: AdviceTarget = {kind: "general"};

export function courseAdvice(slug: string): AdviceTarget {
  return {kind: "course", slug};
}

function firstString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAdviceQuery(search: {
  mode?: string | string[];
  date?: string | string[];
}): AdviceQuery {
  const mode = firstString(search.mode) === "write" ? "write" : "call";
  const dateRaw = firstString(search.date);
  return {
    mode,
    date: dateRaw && isIsoDate(dateRaw) ? dateRaw : undefined,
  };
}

export function adviceHref(
  target: AdviceTarget,
  query: Partial<AdviceQuery> = {},
): PathnameHref {
  // `call` and an absent date are the defaults, so they stay out of the URL.
  const search = {
    ...(query.mode && query.mode !== "call" ? {mode: query.mode} : {}),
    ...(query.date ? {date: query.date} : {}),
  };

  return target.kind === "course"
    ? {
        pathname: "/courses/[slug]/advice",
        params: {slug: target.slug},
        query: search,
      }
    : {pathname: "/advice", query: search};
}
