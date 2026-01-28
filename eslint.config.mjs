import globals from "globals";
import js from "@eslint/js";

export default [
  // FRONT
  {
    files: ["**/*.{js,mjs}"],
    ignores: ["node_modules/**", "server.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // BACK 
  {
    files: ["server.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.node,
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },

  // TESTS (Jest)
  {
    files: ["**/tests/**/*.js", "**/*.test.js", "**/*.spec.js"],
    languageOptions: {
      globals: {
        ...globals.jest, // expect, test, describe, beforeEach, etc.
      },
    },
  },
];



