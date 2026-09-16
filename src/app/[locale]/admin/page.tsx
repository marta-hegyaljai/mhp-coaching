import {redirect} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

type AdminIndexProps = {
  params: Promise<{locale: AppLocale}>;
};

export const dynamic = "force-dynamic";

export default async function AdminIndexPage({params}: AdminIndexProps) {
  const {locale} = await params;
  redirect({href: "/admin/overview", locale});
}
