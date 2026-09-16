import type {Course} from "@/features/courses/types";

/**
 * Public catalogue sections stay hidden when every course in them is
 * unpublished, or when search/month filters leave the section empty.
 * A programme still keeps its own category open.
 */
export function catalogueGroupHasOfferings(
  group: {category: Course["category"]; courses: readonly unknown[]},
  programmes: ReadonlyArray<{category: Course["category"]}> = [],
): boolean {
  return (
    group.courses.length > 0 ||
    programmes.some((programme) => programme.category === group.category)
  );
}
