import {describe, expect, it} from "vitest";

import {homeGalleryPhotos} from "@/features/gallery/photos";

import {
  GALLERY_ALBUM_DESKTOP_COUNT,
  galleryAlbumPageCount,
  galleryAlbumPagePhotos,
  galleryAlbumStatus,
  stepGalleryAlbumPage,
  wrapGalleryAlbumPage,
} from "./gallery-album-window";

describe("gallery album window", () => {
  it("keeps the homepage album in even desktop spreads of three", () => {
    expect(homeGalleryPhotos.length).toBeGreaterThanOrEqual(15);
    expect(homeGalleryPhotos.length % GALLERY_ALBUM_DESKTOP_COUNT).toBe(0);
    expect(
      galleryAlbumPageCount(
        homeGalleryPhotos.length,
        GALLERY_ALBUM_DESKTOP_COUNT,
      ),
    ).toBe(homeGalleryPhotos.length / GALLERY_ALBUM_DESKTOP_COUNT);
  });

  it("lets a phone step through every photograph, one frame at a time", () => {
    expect(galleryAlbumPageCount(13, 1)).toBe(13);
    expect(stepGalleryAlbumPage(12, 13, 1)).toBe(0);
    expect(stepGalleryAlbumPage(0, 13, -1)).toBe(12);
    expect(galleryAlbumPagePhotos(["a", "b", "c"], 1, 1)).toEqual(["b"]);
  });

  it("turns the desktop album by a whole spread, never by a single leftover frame", () => {
    const photos = Array.from({length: 18}, (_, index) => index + 1);

    expect(galleryAlbumPageCount(18, 3)).toBe(6);
    expect(galleryAlbumPagePhotos(photos, 0, 3)).toEqual([1, 2, 3]);
    expect(galleryAlbumPagePhotos(photos, 4, 3)).toEqual([13, 14, 15]);
    expect(galleryAlbumPagePhotos(photos, 5, 3)).toEqual([16, 17, 18]);
    expect(stepGalleryAlbumPage(5, 6, 1)).toBe(0);
    expect(stepGalleryAlbumPage(0, 6, -1)).toBe(5);
    expect(galleryAlbumPagePhotos(photos, 6, 3)).toEqual([1, 2, 3]);
  });

  it("fills a short last spread by wrapping so the frame is never empty", () => {
    const photos = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    expect(galleryAlbumPageCount(16, 3)).toBe(6);
    expect(galleryAlbumPagePhotos(photos, 4, 3)).toEqual([13, 14, 15]);
    expect(galleryAlbumPagePhotos(photos, 5, 3)).toEqual([16, 1, 2]);
    expect(stepGalleryAlbumPage(5, 6, 1)).toBe(0);
  });

  it("stays on one spread when the archive is smaller than the window", () => {
    expect(galleryAlbumPageCount(2, 3)).toBe(1);
    expect(stepGalleryAlbumPage(0, 1, 1)).toBe(0);
    expect(galleryAlbumPagePhotos(["a", "b"], 0, 3)).toEqual(["a", "b", "a"]);
  });

  it("counts pages, not individual photographs", () => {
    expect(galleryAlbumStatus(0, 16)).toEqual({current: "01", total: "16"});
    expect(galleryAlbumStatus(5, 6)).toEqual({current: "06", total: "06"});
    expect(wrapGalleryAlbumPage(-1, 6)).toBe(5);
  });
});
