import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "static/**",
      "standalone/**",
      "dist/**",
      "public/**",
      "node_modules/**",
      "_backup/**",
      "demo/**",
      "docs/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["tools/**/*.js", "*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      // Игра и старые инструменты намеренно используют глобальные функции
      // между файлами; включать no-undef без переезда на модули нельзя.
      "no-undef": "off",
      "no-unused-vars": "off"
    }
  }
];
