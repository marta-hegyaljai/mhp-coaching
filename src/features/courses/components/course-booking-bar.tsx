import type {Course} from "@/features/courses/types";
import {formatCataloguePrice} from "@/features/courses/price";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {buttonStyles} from "@/shared/ui/button";
import {ArrowRightIcon} from "@/shared/ui/icons";
import {Price} from "@/shared/ui/price";

/**
 * Phone-only action bar that keeps the booking call to action within thumb
 * reach on long course pages. `SiteShell` reserves the space it covers.
 */
export function CourseBookingBar({
  course,
  locale,
  label,
  fromLabel,
}: {
  course: Course;
  locale: AppLocale;
  label: string;
  fromLabel: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink bg-ivory lg:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-subtle">
            {fromLabel}
          </p>
          <Price size="md" className="mt-1 leading-tight">
            {formatCataloguePrice(course.priceChf, locale)}
          </Price>
        </div>
        <Link
          href={{
            pathname: "/courses/[slug]/book",
            params: {slug: course.slug[locale]},
          }}
          className={buttonStyles()}
        >
          {label}
          <ArrowRightIcon className="transition-transform duration-200 ease-standard group-hover/button:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
