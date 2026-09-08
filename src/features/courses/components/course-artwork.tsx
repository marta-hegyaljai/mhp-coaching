import Image from "next/image";

import {getCourseImage} from "@/features/courses/source-content";
import type {Course} from "@/features/courses/types";

export function CourseArtwork({
  course,
  sizes,
  priority = false,
  interactive = false,
}: {
  course: Course;
  sizes: string;
  priority?: boolean;
  interactive?: boolean;
}) {
  return (
    <>
      <Image
        src={getCourseImage(course)}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className={`object-contain ${
          interactive
            ? "transition-transform duration-150 group-hover/card:scale-[1.025] motion-reduce:transform-none"
            : ""
        }`}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[2%] right-[2%] h-[17%] w-[17%] backdrop-blur-[12px]"
      />
    </>
  );
}
