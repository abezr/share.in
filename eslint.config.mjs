export default [
  {
    files: ["**/*.{js,mjs,cjs}"],
    ignores: [
      "**/node_modules/**",
      "dist/**",
      "docs/**",
      "**/*.md"
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      semi: ["error", "always"],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error"
    }
  }
];
