import {redirect} from "next/navigation";

import type {User} from "@/db/schema";
import {
  canAccessRooms,
  canAdminister,
  canAccessStaffLists,
} from "@/features/auth/policy";
import {safeInternalPath} from "@/features/auth/redirect-path";
import {readSessionUser} from "@/features/auth/session";
import {localizedPathname} from "@/i18n/path";
import type {AppLocale} from "@/i18n/routing";

export type Viewer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  canAccessRooms: boolean;
  canAccessStaffLists: boolean;
};

export function toViewer(user: User): Viewer {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: canAdminister(user),
    canAccessRooms: canAccessRooms(user),
    canAccessStaffLists: canAccessStaffLists(user),
  };
}

export async function getViewer(): Promise<Viewer | null> {
  try {
    const user = await readSessionUser();
    if (!user) {
      return null;
    }
    return toViewer(user);
  } catch {
    return null;
  }
}

function signInHref(locale: AppLocale, nextPath: string): string {
  const signIn = localizedPathname(locale, "/sign-in");
  const next = encodeURIComponent(safeInternalPath(nextPath, locale));
  return `${signIn}?next=${next}`;
}

export async function requireSignedInUser(
  locale: AppLocale,
  nextPath: string,
): Promise<User> {
  const user = await readSessionUser();

  if (!user) {
    redirect(signInHref(locale, nextPath));
  }

  return user;
}

export async function requireAdmin(
  locale: AppLocale,
  nextPath: string,
): Promise<User> {
  const user = await requireSignedInUser(locale, nextPath);

  if (!canAdminister(user)) {
    redirect(localizedPathname(locale, "/access-denied"));
  }

  return user;
}

export async function requireRoomBooking(
  locale: AppLocale,
  nextPath: string,
): Promise<User> {
  const user = await requireSignedInUser(locale, nextPath);

  if (!canAccessRooms(user)) {
    redirect(localizedPathname(locale, "/access-denied"));
  }

  return user;
}
