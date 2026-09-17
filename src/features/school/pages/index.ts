import {getWhyChooseBlock} from "../why-choose";

import {curriculumPage} from "./curriculum";
import {facultyPage} from "./faculty";
import {methodPage} from "./method";
import {pedagogyPage} from "./pedagogy";
import {publicationsPage} from "./publications";
import {recognitionsPage} from "./recognitions";
import {supervisionPage} from "./supervision";
import type {SchoolPage, SchoolPageId} from "./types";

export type {
  SchoolPage,
  SchoolPageId,
  SchoolPerson,
  SchoolRegistry,
  SchoolWork,
} from "./types";
export {META_DESCRIPTION_LIMIT} from "./types";

/**
 * Reading order, kept identical to the home-page cards so the footer, the
 * sibling navigation and the section never disagree about sequence.
 */
export const schoolPagesInOrder: readonly SchoolPage[] = [
  curriculumPage,
  pedagogyPage,
  recognitionsPage,
  facultyPage,
  supervisionPage,
  methodPage,
  publicationsPage,
];

const byId = new Map<SchoolPageId, SchoolPage>(
  schoolPagesInOrder.map((page) => [page.id, page]),
);

export function getSchoolPage(id: SchoolPageId): SchoolPage {
  const page = byId.get(id);

  if (!page) {
    throw new Error(`Unknown school page: ${id}`);
  }

  return page;
}

/** The page plus the home-page card it is the destination of. */
export function schoolPageCopy(id: SchoolPageId) {
  const page = getSchoolPage(id);

  return {page, block: getWhyChooseBlock(page.blockId)};
}

/** Every other school page, so no detail page is a dead end. */
export function siblingSchoolPages(id: SchoolPageId): readonly SchoolPage[] {
  return schoolPagesInOrder.filter((page) => page.id !== id);
}
