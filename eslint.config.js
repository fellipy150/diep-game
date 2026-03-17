import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "converte.js"
    ]
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_"
      }]
    }
  },
  js.configs.recommended
]
