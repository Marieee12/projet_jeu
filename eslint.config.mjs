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
];



