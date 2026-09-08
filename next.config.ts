import createNextIntlPlugin from "next-intl/plugin";

import {legacyRedirects} from "./src/features/seo/legacy-redirects";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl({
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  serverExternalPackages: ["pg", "nodemailer", "stripe"],
  async redirects() {
    return [...legacyRedirects];
  },
});
