import js from "@eslint/js"
import globals from "globals"
import importPlugin from "eslint-plugin-import"

export default [

  {
    ignores: [
      "dist/**",
      "node_modules/**"
    ]
  },

  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,
        ...globals.node
      }
    },

    plugins: {
      import: importPlugin
    },

    settings: {
      "import/resolver": {
        node: {
          extensions: [".js"]
        }
      }
    },

    rules: {

      /*
      =====================
      ERROS REAIS
      =====================
      */

      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_"
        }
      ],

      /*
      =====================
      IMPORT / EXPORT
      =====================
      */

      "import/no-unresolved": "error",

      "import/named": "error",

      "import/default": "error",

      "import/namespace": "error",

      "import/no-duplicates": "error",

      "import/no-cycle": "warn",

      "import/newline-after-import": "warn",

      /*
      =====================
      QUALIDADE
      =====================
      */

      "no-var": "error",

      "prefer-const": "warn",

      "no-debugger": "warn",

      "no-console": "off"
    }
  },

  js.configs.recommended
]
