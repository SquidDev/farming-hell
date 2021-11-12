import commonjs from "@rollup/plugin-commonjs";
import html, { makeHtmlAttributes } from "@rollup/plugin-html";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import url from "@rollup/plugin-url";
import autoprefixer from "autoprefixer";
import { promises as fs } from "fs";
import path from "path";
import copy from "rollup-plugin-copy";
import license from "rollup-plugin-license";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import tailwindcss from "tailwindcss";
import alias from "@rollup/plugin-alias";

const isProfiling = process.env.PROFILE !== undefined;
const isProduction = process.env.NODE_ENV === "production";
const outDir = "_build/dist";

export default {
  input: ["src/index.tsx"],
  output: {
    dir: outDir,
    format: "iife",
    preferConst: true,
    entryFileNames: "[name]-[hash].js",

    externalLiveBindings: isProduction,
    freeze: isProduction,
  },
  context: "window",

  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
      "preventAssignment": true,
    }),

    postcss({
      extract: true,
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
      minimize: isProduction,
    }),

    url({
      include: ["**/*.json", "**/*.png"],
      limit: 0,
      fileName: "[name]-[hash][extname]",
    }),

    typescript(),
    isProfiling && alias({
      entries: {
        "react-dom": "react-dom/profiling",
        "scheduler/tracing": "scheduler/tracing-profiling",
      },
    }),
    resolve({ browser: true }),
    commonjs(),

    copy({ targets: [{ src: "_build/data/*.png", dest: outDir }] }),

    html({
      template: async ({ attributes, files, publicPath }) => {
        const scripts = (files.js || [])
          .map(({ fileName }) => `<script src="${publicPath}${fileName}"${makeHtmlAttributes(attributes.script)}></script>`)
          .join("\n");

        const links = (files.css || [])
          .map(({ fileName }) => `<link href="${publicPath}${fileName}" rel="stylesheet"${makeHtmlAttributes(attributes.link)}>`)
          .join("\n");

        const templateFields = { scripts, links };

        const template = await fs.readFile("src/index.html", { encoding: "utf-8" });
        return template.replace(/\$\{([^}]+)\}/g, (_, name) => {
          const value = templateFields[name];
          if (value === undefined) throw new Error(`Unknown field ${name}`);
          return value;
        });
      },
    }),

    license({
      banner: {
        commentStyle: "slash",
        content: "See licenses.txt for licenses",
      },
      thirdParty: {
        output: {
          file: path.join(outDir, "licenses.txt"),
          encoding: "utf-8",
        },
      },
    }),

    isProduction && terser({
      format: {
        comments: false,
        preamble: "// See licenses.txt for licenses",
      },
    }),
  ],
};
