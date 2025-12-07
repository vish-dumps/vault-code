import type { Config } from "tailwindcss";
import baseConfig from "../tailwind.config";

const config: Config = {
  // Reuse the shared theme/colors/plugins from the root config
  ...baseConfig,
  // Point Tailwind at the client sources so utilities like `border-border` are generated
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
};

export default config;
