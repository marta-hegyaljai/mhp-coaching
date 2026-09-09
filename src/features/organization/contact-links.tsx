import {organization} from "./info";

type ContactLinksProps = {
  className?: string;
  linkClassName: string;
};

export function ContactLinks({className, linkClassName}: ContactLinksProps) {
  return (
    <p className={className}>
      <a className={linkClassName} href={organization.phoneHref}>
        {organization.phone}
      </a>
      <br />
      <a className={linkClassName} href={organization.emailHref}>
        {organization.email}
      </a>
    </p>
  );
}

export function OrganizationContactText({
  text,
  className,
  linkClassName,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  linkClassName: string;
  as?: "p" | "span";
}) {
  const parts = text.split(
    new RegExp(
      `(${escapeRegExp(organization.email)}|${escapeRegExp(organization.phone)})`,
    ),
  );

  return (
    <Tag className={className}>
      {parts.map((part, index) => {
        if (part === organization.email) {
          return (
            <a key={`${part}-${index}`} className={linkClassName} href={organization.emailHref}>
              {part}
            </a>
          );
        }

        if (part === organization.phone) {
          return (
            <a key={`${part}-${index}`} className={linkClassName} href={organization.phoneHref}>
              {part}
            </a>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </Tag>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
