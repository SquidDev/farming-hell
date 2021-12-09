const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./src/**/*.html",
    "./src/**/*.ts",
    "./src/**/*.tsx",
  ],
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
