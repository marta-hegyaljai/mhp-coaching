"use client";

import Image from "next/image";
import {useTranslations} from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from "react";

import type {GalleryPhoto} from "@/features/gallery/photos";
import {Link} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import {ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon} from "@/shared/ui/icons";

import {
  GALLERY_ALBUM_DESKTOP_COUNT,
  GALLERY_ALBUM_INTERVAL_MS,
  GALLERY_ALBUM_MOBILE_COUNT,
  galleryAlbumPageCount,
  galleryAlbumPagePhotos,
  galleryAlbumStatus,
  stepGalleryAlbumPage,
} from "./gallery-album-window";

const frameClass =
  "relative aspect-[3/2] min-w-0 overflow-hidden rounded-panel border border-ink bg-ink";
const stepClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-panel border border-ink bg-white text-ink transition-colors duration-150 ease-standard hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40";

function AlbumSpread({
  locale,
  photos,
}: {
  locale: AppLocale;
  photos: readonly GalleryPhoto[];
}) {
  return (
    <>
      {photos.map((photo, slot) => (
        <figure key={`${photo.id}-${slot}`} className={frameClass}>
          <Image
            src={photo.src}
            alt={photo.alt[locale]}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="pointer-events-none object-cover"
          />
        </figure>
      ))}
    </>
  );
}

export function GalleryAlbum({
  locale,
  photos,
}: {
  locale: AppLocale;
  photos: readonly GalleryPhoto[];
}) {
  const t = useTranslations("HomePage");
  const labelId = useId();
  const touchStartX = useRef<number | null>(null);
  const [mobilePage, setMobilePage] = useState(0);
  const [desktopPage, setDesktopPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const albumRef = useRef<HTMLDivElement>(null);

  const mobilePageCount = galleryAlbumPageCount(
    photos.length,
    GALLERY_ALBUM_MOBILE_COUNT,
  );
  const desktopPageCount = galleryAlbumPageCount(
    photos.length,
    GALLERY_ALBUM_DESKTOP_COUNT,
  );
  const canCycle = photos.length > 1;
  const mobileSpread = galleryAlbumPagePhotos(
    photos,
    mobilePage,
    GALLERY_ALBUM_MOBILE_COUNT,
  );
  const desktopSpread = galleryAlbumPagePhotos(
    photos,
    desktopPage,
    GALLERY_ALBUM_DESKTOP_COUNT,
  );
  const mobileStatus = galleryAlbumStatus(mobilePage, mobilePageCount);
  const desktopStatus = galleryAlbumStatus(desktopPage, desktopPageCount);

  function show(step: 1 | -1) {
    if (!canCycle) {
      return;
    }
    setMobilePage((page) => stepGalleryAlbumPage(page, mobilePageCount, step));
    setDesktopPage((page) =>
      stepGalleryAlbumPage(page, desktopPageCount, step),
    );
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function sync() {
      setReducedMotion(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const album = albumRef.current;
    if (!album) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry ? entry.isIntersecting : false),
      {threshold: 0.35},
    );
    observer.observe(album);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || hovered || reducedMotion || !inView || !canCycle) {
      return;
    }

    const timer = window.setInterval(() => {
      setMobilePage((page) => stepGalleryAlbumPage(page, mobilePageCount, 1));
      setDesktopPage((page) =>
        stepGalleryAlbumPage(page, desktopPageCount, 1),
      );
    }, GALLERY_ALBUM_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [
    canCycle,
    desktopPageCount,
    hovered,
    inView,
    mobilePageCount,
    paused,
    reducedMotion,
  ]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!canCycle) {
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      show(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      show(-1);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) {
      return;
    }
    const delta = end - start;
    if (Math.abs(delta) < 40) {
      return;
    }
    show(delta < 0 ? 1 : -1);
  }

  return (
    <div
      ref={albumRef}
      className="mt-6 min-w-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p id={labelId} className="sr-only">
        {t("galleryAlbum")}
      </p>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-labelledby={labelId}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        <div className="grid grid-cols-1 gap-2 md:hidden">
          <AlbumSpread locale={locale} photos={mobileSpread} />
        </div>
        <div className="hidden grid-cols-3 gap-2 md:grid">
          <AlbumSpread locale={locale} photos={desktopSpread} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={stepClass}
            aria-label={t("galleryPrevious")}
            disabled={!canCycle}
            onClick={() => show(-1)}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            aria-pressed={paused}
            aria-label={paused ? t("galleryPlay") : t("galleryPause")}
            onClick={() => setPaused((currentPaused) => !currentPaused)}
            className="inline-flex min-h-11 min-w-[5.75rem] items-center justify-center px-3 font-sans text-sm tabular-nums text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span className="md:hidden">
              {t("galleryStatus", mobileStatus)}
            </span>
            <span className="hidden md:inline">
              {t("galleryStatus", desktopStatus)}
            </span>
          </button>
          <button
            type="button"
            className={stepClass}
            aria-label={t("galleryNext")}
            disabled={!canCycle}
            onClick={() => show(1)}
          >
            <ChevronRightIcon />
          </button>
        </div>

        <Link
          href="/gallery"
          className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
        >
          {t("galleryLink")}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
