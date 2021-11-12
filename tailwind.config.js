const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: [
    "./src/**/*.html",
    "./src/**/*.ts",
    "./src/**/*.tsx",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        blue: colors.blue,
        green: colors.green,
        red: colors.red,
      },
      lineHeight: {
        24: "6rem"
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
