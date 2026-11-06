import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const nextConfig = compat.extends("next/core-web-vitals").map((config) =>
  config.files || config.ignores
    ? config
    : { ...config, files: ["**/*.{js,jsx,mjs,cjs}"] },
);

export default defineConfig([
  ...nextConfig,
  {
    rules: {
      // Patrones existentes del proyecto que no son compatibles con las
      // comprobaciones estrictas del React Compiler de Next 16.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
