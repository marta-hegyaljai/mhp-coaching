import {getTranslations} from "next-intl/server";

import type {CertificateCardView} from "@/features/certificates/views";

import {AttachCertificateForm, type CourseOption} from "./attach-form";
import {AdminCertificateRow} from "./certificate-row";

export async function AdminCertificatePanel({
  locale,
  userId,
  certificates,
  courses,
}: {
  locale: string;
  userId: string;
  certificates: CertificateCardView[];
  courses: CourseOption[];
}) {
  const t = await getTranslations("Certificates");

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-serif text-subheading">{t("adminTitle")}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-muted">{t("adminIntro")}</p>
      </div>

      {certificates.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("adminEmpty")}</p>
      ) : (
        <ul className="space-y-4">
          {certificates.map((certificate) => (
            <AdminCertificateRow
              key={certificate.id}
              locale={locale}
              userId={userId}
              certificate={certificate}
            />
          ))}
        </ul>
      )}

      <AttachCertificateForm locale={locale} userId={userId} courses={courses} />
    </section>
  );
}
