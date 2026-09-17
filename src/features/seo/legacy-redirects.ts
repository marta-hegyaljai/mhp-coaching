export const legacyRedirects = [
  {source: "/", destination: "/fr", permanent: true, locale: false},
  {
    source: "/formations/praticien-en-hypnose-elmanienne-omni",
    destination: "/fr/formations/praticien-hypnose-omni",
    permanent: true,
    locale: false,
  },
  {
    source: "/formation-hypnose-therapeutique",
    destination: "/fr/formations",
    permanent: true,
    locale: false,
  },
  {
    source: "/formation-hypnose-fribourg",
    destination: "/fr/formations",
    permanent: true,
    locale: false,
  },
  {source: "/a-propos", destination: "/fr/a-propos", permanent: true, locale: false},
  {source: "/avis", destination: "/fr/avis", permanent: true, locale: false},
  {source: "/contact", destination: "/fr/contact", permanent: true, locale: false},
  {source: "/agenda", destination: "/fr/inscription", permanent: true, locale: false},
] as const;
