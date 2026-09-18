export const GALLERY_ALBUM_INTERVAL_MS = 5000;
export const GALLERY_ALBUM_MOBILE_COUNT = 1;
export const GALLERY_ALBUM_DESKTOP_COUNT = 3;

export function galleryAlbumPageCount(count: number, visibleCount: number) {
  if (count <= 0 || visibleCount <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(count / visibleCount));
}

export function wrapGalleryAlbumPage(page: number, pageCount: number) {
  if (pageCount <= 0) {
    return 0;
  }

  return ((page % pageCount) + pageCount) % pageCount;
}

export function stepGalleryAlbumPage(
  page: number,
  pageCount: number,
  step: 1 | -1,
) {
  return wrapGalleryAlbumPage(page + step, pageCount);
}

export function galleryAlbumPagePhotos<T>(
  photos: readonly T[],
  page: number,
  visibleCount: number,
) {
  const count = photos.length;
  if (count === 0 || visibleCount <= 0) {
    return [] as T[];
  }

  const pageCount = galleryAlbumPageCount(count, visibleCount);
  const start = wrapGalleryAlbumPage(page, pageCount) * visibleCount;
  const spread: T[] = [];

  for (let offset = 0; offset < visibleCount; offset += 1) {
    const photo = photos[(start + offset) % count];
    if (photo) {
      spread.push(photo);
    }
  }

  return spread;
}

export function galleryAlbumStatus(page: number, pageCount: number) {
  const safe = wrapGalleryAlbumPage(page, pageCount);
  const pad = (value: number) => String(value).padStart(2, "0");

  return {
    current: pad(safe + 1),
    total: pad(pageCount),
  };
}
