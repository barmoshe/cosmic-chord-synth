import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Empty catch blocks are an intentional Tone.js safety pattern throughout the codebase
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Audio/scene refs hold heterogenous Tone.js/Three.js objects — keep `any` as a warning
      "@typescript-eslint/no-explicit-any": "warn",
      // shadcn/ui components commonly use empty interfaces as aliases for prop types
      "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "with-single-extends" }],
    },
  },
  {
    // Tailwind config is a CommonJS-style config file where require() is standard
    files: ["tailwind.config.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
