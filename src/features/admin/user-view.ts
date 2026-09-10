import type {User} from "@/db/schema";

export type AdminUserView = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  roomBookingEnabled: boolean;
  disabled: boolean;
  pendingInvite: boolean;
  createdAt: string;
};

export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin,
    roomBookingEnabled: user.roomBookingEnabled,
    disabled: user.disabledAt !== null,
    pendingInvite: user.passwordHash === null,
    createdAt: user.createdAt.toISOString(),
  };
}
