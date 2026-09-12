"use client";

import {useTranslations} from "next-intl";

import {Link, usePathname} from "@/i18n/navigation";
import {buttonStyles} from "@/shared/ui/button";

import {NavCurrent} from "./nav-current";

/**
 * One guest auth action in the shell: Sign in everywhere except on the sign-in
 * page, where Sign up is offered instead. Logged-in people use AccountMenu.
 */
export function GuestAuthAction({block = false}: {block?: boolean}) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const onSignIn = pathname === "/sign-in";
  const href = onSignIn ? "/sign-up" : "/sign-in";
  const label = onSignIn ? t("signUp") : t("signIn");

  return (
    <NavCurrent match={href} activeClassName="">
      <Link
        href={href}
        className={buttonStyles({
          variant: "secondary",
          size: block ? "lg" : "md",
          block,
        })}
      >
        {label}
      </Link>
    </NavCurrent>
  );
}
