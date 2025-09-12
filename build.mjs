import fs from "fs-extra";
import { resolve, join, basename } from "path";
import chalk from "chalk";

import { watch as chokidarWatch } from "chokidar";

import { compile } from "sass";
import { rollup, watch as rollupWatch } from "rollup";
import rollupTypescript from "@rollup/plugin-typescript";
import { nodeResolve as rollupResolve } from "@rollup/plugin-node-resolve";
import rollupAlias from "@rollup/plugin-alias";

import buildTools from "build-tools";

function timeUnit(time) {
  return time < 500
    ? `${Math.round(time * 10) / 10}ms`
    : `${Math.round(time / 10) / 100}s`;
}

async function time(name, fn, ...args) {
  const start = performance.now();
  await fn();
  const time = performance.now() - start;

  console.log(chalk.blue(name), "completed in", chalk.green(timeUnit(time)));
}

// Configuration
const options = {
  outDir: resolve("dist"),
  manifest: "./src/module.json",
  tsEntrypoint: "./src/mobile-improvements.ts",
};

const packageTool = new buildTools.PackageTool(options);

// Patterns for watch & compile
const sourceGroups = {
  ts: ["src/**/*.ts"],
  sass: [
    "src/mobile-improvements.scss",
    "src/sheets/dnd5e.scss",
    "src/sheets/pf2e.scss",
    "src/sheets/gurps.scss",
    "src/sheets/sfrpg.scss",
  ],

  // Folders are copied as-is
  folders: ["templates", "lang"],
};

/********************/
/*		BUILD		*/
/********************/

/**
 * Build TypeScript
 */
/**
 * @type {rollup.RollupOptions}
 */
const rollupOptions = {
  strictDeprecations: true,
  input: options.tsEntrypoint,
  preserveEntrySignatures: "allow-extension",
  plugins: [
    rollupAlias({
      entries: [
        {
          find: "module",
          replacement: resolve("./src/module"),
        },
      ],
    }),
    rollupTypescript(),
    rollupResolve({ browser: true }),
  ],
};

/**
 * @type {rollup.OutputOptions}
 */
const rollupOutputOptions = {
  dir: "./dist",
  format: "es",
  generatedCode: {
    constBindings: true,
  },
  minifyInternalExports: false,
  exports: "auto",
  chunkFileNames: "[name].js",
  sourcemap: true,
  manualChunks(id) {
    if (id.includes("node_modules")) {
      return "vendor";
    }
  },
};

async function buildTS() {
  const bundle = await rollup(rollupOptions);
  await bundle.write(rollupOutputOptions);
}

async function watchTS() {
  const watchOptions = { ...rollupOptions, output: rollupOutputOptions };
  const watcher = rollupWatch(watchOptions);

  watcher.on("event", (event) => {
    if (event.code === "BUNDLE_START") {
      console.log(chalk.blue("TypeScript"), "started");
    }
    if (event.code === "ERROR") {
      const error = event.error;
      console.warn(
        chalk.blue("TypeScript"),
        "error:",
        `${error.plugin}:${error.pluginCode}`,
        "\n" + error.frame,
        `\n${error.filename}`
      );
    }
    if (event.code === "BUNDLE_END") {
      console.log(
        chalk.blue("TypeScript"),
        "built in",
        chalk.green(timeUnit(event.duration))
      );
    }
  });

  // This will make sure that bundles are properly closed after each run
  watcher.on("event", ({ result }) => {
    if (result) {
      result.close();
    }
  });
}

/**
 * Copy static files
 */
async function copyFolders() {
  for (const folder of sourceGroups.folders) {
    if (fs.existsSync(folder)) {
      await fs.copy(folder, join(options.outDir, folder));
    }
  }
}

/**
 * Build sass
 */
async function buildSass() {
  sourceGroups.sass?.forEach((file) => {
    const res = compile(file);
    fs.writeFile(
      join(options.outDir, basename(file).replace(".scss", ".css")),
      res.css
    );
  });
}

/**
 * Watch for changes for each build step
 */
function buildWatch() {
  chokidarWatch(options.manifest).on("all", () =>
    time("Manifest", packageTool.buildManifest)
  );

  chokidarWatch(sourceGroups.folders).on("all", (evt, file) => {
    time(`Copy Folders - ${file}`, async () => {
      if (evt === "addDir") {
        return fs.ensureDir(join(options.outDir, file));
      }

      if (evt === "add" || evt === "change") {
        const out = join(options.outDir, file);
        return fs.copyFile(file, out);
      }

      if (evt === "unlink") {
        const out = join(options.outDir, file);
        return fs.unlink(out);
      }
    });
  });

  // TODO: Reuse compile, don't build all files when one changes
  chokidarWatch(sourceGroups.sass).on("all", () => time("SASS", buildSass));

  watchTS();
}

async function build() {
  await time("Manifest", packageTool.buildManifest);
  await time("TS", buildTS);
  await time("SASS", buildSass);
  await time("Copy folders", copyFolders);
}

async function clean() {
  if (!fs.existsSync(options.outDir)) {
    return;
  }

  const files = await fs.readdir(options.outDir);
  console.log(" ", chalk.yellow("Files to clean:"));
  console.log("   ", chalk.blueBright(files.join("\n    ")));

  await Promise.all(
    files.map((filePath) => fs.remove(join(options.outDir, filePath)))
  );
}

// Single tasks

const commands = {
  build: () => build(),
  watch: () => buildWatch(),
  clean: () => clean(),
  package: () => packageTool.package(),
  link: () => buildTools.linkUserData(options.manifest, options.outDir),
  unlink: () => buildTools.unlinkUserData(options.manifest),
};

const cmds = process.argv.slice(2);

(async () => {
  for (const cmd of cmds) {
    if (!commands[cmd]) {
      console.error(`Unknown command "${cmd}"`);
      process.exit(1);
    }
    if (cmds.length > 1) {
      console.log(chalk.magenta(cmd));
    }
    await commands[cmd]();
  }
})();
