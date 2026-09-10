export type AccessUser = {
  id: string;
  isAdmin: boolean;
  roomBookingEnabled: boolean;
  disabledAt: Date | null;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
};

export function isEnabledAccount(user: AccessUser): boolean {
  return user.disabledAt === null;
}

export function canAuthenticate(user: AccessUser): boolean {
  return (
    isEnabledAccount(user) &&
    user.passwordHash !== null &&
    user.emailVerifiedAt !== null
  );
}

export function canAdminister(user: AccessUser): boolean {
  return isEnabledAccount(user) && user.isAdmin;
}

export function canAccessRooms(user: AccessUser): boolean {
  return isEnabledAccount(user) && user.roomBookingEnabled;
}

export function canAccessStaffLists(user: AccessUser): boolean {
  return canAdminister(user);
}

export function publicCapabilities(user: AccessUser): {
  isAdmin: boolean;
  canAccessRooms: boolean;
} {
  return {
    isAdmin: canAdminister(user),
    canAccessRooms: canAccessRooms(user),
  };
}
