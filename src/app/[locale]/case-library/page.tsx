import {comingSoonMetadata, comingSoonPage} from "@/features/site-shell/coming-soon-page";

const copy = {
  navKey: "caseLibrary",
  pathname: "/case-library",
  namespace: "CaseLibraryPage",
} as const;

export const generateMetadata = comingSoonMetadata(copy);
export default comingSoonPage(copy);
