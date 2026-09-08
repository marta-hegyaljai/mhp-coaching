export const legacyRedirects = [
  {source: "/", destination: "/fr", permanent: true},
  {source: "/formations", destination: "/fr/formations", permanent: true},
  {
    source: "/formations/praticien-en-hypnose-elmanienne-omni",
    destination: "/fr/formations/praticien-hypnose-omni",
    permanent: true,
  },
  {
    source: "/formation-hypnose-therapeutique",
    destination: "/fr/formations",
    permanent: true,
  },
  {
    source: "/formation-hypnose-lausanne",
    destination: "/fr/formations",
    permanent: true,
  },
  {
    source: "/formation-hypnose-fribourg",
    destination: "/fr/formations",
    permanent: true,
  },
  {
    source: "/formation-hypnose-geneve",
    destination: "/fr/formations",
    permanent: true,
  },
  {source: "/a-propos", destination: "/fr", permanent: true},
  {source: "/contact", destination: "/fr/contact", permanent: true},
  {source: "/agenda", destination: "/fr/formations", permanent: true},
] as const;
