module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  plugins: [
    "import",
  ],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // Formatting
    "comma-dangle": ["error", "only-multiline"],
    "semi": ["warn", "always"],
    "quotes": ["warn", "double"],
    "no-constant-condition": ["warn", { checkLoops: false }],
    "arrow-parens": ["warn", "as-needed"],
    "curly": ["warn", "multi-line", "consistent"],
    "indent": ["warn", 2, { SwitchCase: 1 }],
    "object-shorthand": ["warn", "always", { avoidQuotes: true }],
    "quote-props": ["warn", "consistent-as-needed"],
    "no-useless-rename": "warn",
    "sort-imports": ["warn", {
      ignoreDeclarationSort: true,
    }],
    "prefer-arrow-callback": ["warn", { allowNamedFunctions: true }],
    "prefer-const": "warn",
    "prefer-object-spread": "warn",
    "prefer-template": "warn",

    // Semantics
    "array-callback-return": "warn",
    "consistent-return": "warn",
    "eqeqeq": "warn",

    "no-unused-vars": ["error", { varsIgnorePattern: "^_.*$" }],
    "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_.*$" }],

    "react/button-has-type": "error",

    "import/no-extraneous-dependencies": ["error", { devDependencies: false, optionalDependencies: false, peerDependencies: false }],
    "import/order": ["warn", {
      "groups": [
        ["builtin", "external"],
        ["sibling", "parent", "index"],
      ],
      "newlines-between": "always",
    }],
  },

  overrides: [
    {
      files: ["rollup.config.js"],
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2018,
      },
    },

    {
      files: [
        "rollup.config.js",
        "*.test.ts", "*.test.tsx",
      ],
      rules: {
        "import/no-extraneous-dependencies": ["error", { devDependencies: true, optionalDependencies: false, peerDependencies: false }],
      },
    },

    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.json"],
      },
      plugins: [
        "@typescript-eslint",
      ],
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
        "plugin:import/typescript",
      ],
      rules: {
        // Aesthetics
        "@typescript-eslint/member-delimiter-style": ["warn", {
          multiline: { delimiter: "comma" },
          singleline: { delimiter: "comma" },
        }],

        // Semantics
        "@typescript-eslint/explicit-function-return-type": ["warn", { allowExpressions: true }],
        "@typescript-eslint/no-non-null-assertion": "off", // TODO: Audit these.
        "@typescript-eslint/prefer-for-of": "warn",
        "@typescript-eslint/prefer-includes": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": "warn",
        "@typescript-eslint/prefer-optional-chain": "warn",

        "@typescript-eslint/ban-ts-comment": ["error", {
          "ts-ignore": "allow-with-description",
        }],
      }
    }
  ]
};
