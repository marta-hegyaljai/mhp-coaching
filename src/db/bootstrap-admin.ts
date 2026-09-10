import {config} from "dotenv";

import {closeDb} from "@/db";
import {AUDIT_ACTIONS} from "@/features/admin/audit-actions";
import {isValidEmail, normalizeEmail} from "@/features/auth/email";
import {hashPassword, passwordErrors} from "@/features/auth/password";
import {
  accessSnapshot,
  countEnabledAdmins,
  findUserByNormalizedEmail,
  insertUser,
  recordAudit,
  updateUser,
} from "@/features/auth/repository";
import {routing} from "@/i18n/routing";

config({path: ".env.local"});
config();

async function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL ?? "";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "";
  const firstName = (process.env.BOOTSTRAP_ADMIN_FIRST_NAME ?? "Admin").trim();
  const lastName = (process.env.BOOTSTRAP_ADMIN_LAST_NAME ?? "MHP").trim();
  const locale = routing.locales.includes(
    (process.env.BOOTSTRAP_ADMIN_LOCALE ?? "fr") as (typeof routing.locales)[number],
  )
    ? (process.env.BOOTSTRAP_ADMIN_LOCALE as (typeof routing.locales)[number])
    : "fr";

  if (!isValidEmail(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
  }

  const issues = passwordErrors(password, password, email);

  if (issues.length > 0) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters and must not be the email address.",
    );
  }

  const enabledAdmins = await countEnabledAdmins();

  if (enabledAdmins > 0) {
    throw new Error("An enabled administrator already exists. Bootstrap refused.");
  }

  const emailNormalized = normalizeEmail(email);
  const existing = await findUserByNormalizedEmail(emailNormalized);
  const passwordHash = await hashPassword(password);

  const user = existing
    ? await updateUser(existing.id, {
        passwordHash,
        emailVerifiedAt: new Date(),
        isAdmin: true,
        roomBookingEnabled: false,
        disabledAt: null,
        firstName,
        lastName,
        locale,
      })
    : await insertUser({
        email: email.trim(),
        emailNormalized,
        firstName,
        lastName,
        locale,
        isAdmin: true,
        roomBookingEnabled: false,
        passwordHash,
        emailVerifiedAt: new Date(),
      });

  await recordAudit({
    actorUserId: user.id,
    targetUserId: user.id,
    action: AUDIT_ACTIONS.BOOTSTRAP_ADMIN_CREATED,
    before: existing ? accessSnapshot(existing) : null,
    after: accessSnapshot(user),
  });

  console.log(`Bootstrap admin ready for ${user.emailNormalized}.`);
}

bootstrapAdmin()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
