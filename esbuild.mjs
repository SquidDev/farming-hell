#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import postcss from 'postcss';
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import esbuild from "esbuild";
import glob from "fast-glob";

const isProduction = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
const analyze = process.argv.includes("--analyze");

/**
 * ESBuild plugin which spits out a license file.
 *
 * @type esbuild.Plugin
 */
const licensePlugin = {
  name: "license",
  setup: build => build.onEnd(async end => {
    const metafile = end.metafile;
    const outdir = build.initialOptions.outdir;
    if (!metafile) throw new Error("Must have metafile to emit license file.");
    if (!outdir) throw new Error("Must have outdir.");

    const packages = new Map();
    for (let filename of Object.keys(metafile.inputs)) {
      while (true) {
        filename = path.dirname(filename);

        let packageInfo;
        try {
          packageInfo = JSON.parse(await fs.readFile(path.join(filename, "package.json"), "utf-8"));
        } catch {
          continue;
        }

        const name = packageInfo.name;
        if (name) packages.set(name, filename);
        break;
      }
    }

    let licenses = "";
    for (const [name, location] of packages.entries()) {
      licenses += `# ${name}\n`;

      let foundLicense = false;
      for (const candidate of ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "license.txt", "License"]) {
        try {
          const license = await fs.readFile(path.join(location, candidate), "utf-8");
          licenses += license + (license.charAt(license.length - 1) == "\n" ? "\n" : "\n\n");
          foundLicense = true;
          break;
        } catch { }
      }

      if (foundLicense) continue;

      const packageInfo = JSON.parse(await fs.readFile(path.join(location, "package.json"), "utf-8"));
      if (packageInfo.license) {
        console.warn(`Did not find license for ${name}, falling back to package.json`);
        licenses += `License: ${packageInfo.license}\n\n`
        continue;
      }

      throw new Error(`Did not find license for ${name}.`);
    }

    await fs.writeFile(path.join(outdir, "licenses.txt"), licenses);
  }),
};


/**
 * esbuild plugin which spits out a HTML index file.
 *
 * @type esbuild.Plugin
 */
const htmlPlugin = {
  name: "html",
  setup: build => build.onEnd(async end => {
    const metafile = end.metafile;
    const outdir = build.initialOptions.outdir;
    if (!metafile) throw new Error("Must have metafile to emit html file.");
    if (!outdir) throw new Error("Must have outdir.");

    const outputCss = Object.keys(metafile.outputs).filter(x => x.endsWith(".css"));
    const outputJs = Object.keys(metafile.outputs).filter(x => x.endsWith(".js"));

    if (outputCss.length !== 1 || outputJs.length !== 1) throw new Error(`Cannot find single css/js file: ${outputCss}, ${outputJs}`);

    const replacements = {
      'links': `<link href="${path.relative(outdir, outputCss[0])}" rel="stylesheet">`,
      'scripts': `<script src="${path.relative(outdir, outputJs[0])}"></script>`,
    }

    const template = await fs.readFile("src/index.html", "utf-8");
    await fs.writeFile(path.join(outdir, "index.html"), template.replaceAll(/\$\{([^}]+)\}/g, (_whole, group) => replacements[group]));
  }),
};

/**
 * esbuild plugin which runs files through postcss.
 *
 * @type esbuild.Plugin
 */
const postcssPlugin = {
  name: "postcss",
  setup: build => {
    const postcssInstance = postcss(
      tailwindcss(),
      autoprefixer(),
    );
    build.onLoad({ filter: /\.css$/, namespace: "file" }, async args => {
      const contents = await fs.readFile(args.path, "utf-8");
      const result = await postcssInstance.process(contents, {
        from: args.path,
        to: "output.css",
      });

      return {
        pluginName: "postcss",
        contents: result.css,
        loader: "css",

        warnings: result.warnings().map(x => ({
          pluginName: x.plugin,
          text: x.text,
        }))
      }
    });
  },
}

/** @type esbuild.Plugin */
const analysePlugin = {
  name: "postcss",
  setup: build => build.onEnd(async args => {
    if (analyze) console.log(await esbuild.analyzeMetafile(args.metafile));
  }),
};

/** @type {(srcGlob: string) => esbuild.Plugin} */
const copyPlugin = srcGlob => ({
  name: "copy",
  setup: build => build.onEnd(async () => {
    const outdir = build.initialOptions.outdir;
    if (!outdir) throw new Error("Must have outdir.");

    for await (const wholePath of glob.stream(srcGlob, { onlyFiles: true })) {
      await fs.copyFile(wholePath, path.join(outdir, path.basename(wholePath)));
    }
  }),
});

(async () => {
  // tiny-case ships a broken tsconfig.json file which breaks esbuild
  try {
    await fs.unlink("node_modules/tiny-case/tsconfig.json")
  } catch { }

  const context = await esbuild.context({
    logLevel: "info",
    metafile: true,

    // Input options
    entryPoints: ['src/index.tsx'],
    inject: ['./src/react-shim.mjs'],
    loader: {
      ".json": "file",
      ".png": "file",
    },

    // Processing options
    bundle: true,
    define: {
      "process.env.NODE_ENV": `"${isProduction ? "production" : "development"}"`,
    },
    plugins: [
      analysePlugin,
      htmlPlugin,
      licensePlugin,
      postcssPlugin,
      copyPlugin("_build/data/*.png"),
    ],

    // Output options
    outdir: "_build/dist",
    minify: isProduction,
    entryNames: "[name]-[hash]",
    legalComments: "none",
    target: "es6",
  });
  if (watch) {
    await context.watch();
  }
  else {
    await context.rebuild();
    await context.dispose();
  }
})().catch(() => process.exit(1))
