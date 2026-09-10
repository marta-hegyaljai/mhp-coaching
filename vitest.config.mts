import {fileURLToPath} from "node:url";

import {config} from "dotenv";
import {defineConfig} from "vitest/config";

config({path: ".env.local"});
config();

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
