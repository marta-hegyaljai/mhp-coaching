import {comingSoonMetadata, comingSoonPage} from "@/features/site-shell/coming-soon-page";

const copy = {
  navKey: "insights",
  pathname: "/insights",
  namespace: "InsightsPage",
  hasSubtitle: true,
} as const;

export const generateMetadata = comingSoonMetadata(copy);
export default comingSoonPage(copy);
