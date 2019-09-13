import fs from "fs";
import path from "path";
import { promisify } from "util";
import rimraf from "rimraf";
import babelDir from "@babel/cli/lib/babel/dir";
import resolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";

const promiseRimraf = promisify(rimraf);

export default async function() {
  await Promise.all([promiseRimraf("dist"), promiseRimraf("src-es")]);

  await Promise.all(
    ["backend", "frontend", "src", "test"].map(directoryName =>
      babelDir({
        cliOptions: {
          root: __dirname,
          filenames: [path.join(__dirname, directoryName)],
          outDir: path.join(__dirname, "src-es", directoryName)
        },
        babelOptions: {
          babelrc: false,
          plugins: [require.resolve("babel-plugin-require-to-import-rewrite")]
        }
      })
    )
  );

  fs.writeFileSync(
    path.join(__dirname, "src-es/index.js"),
    `import * as automerge from "./src/automerge";
export * from "./src/automerge";
export default automerge;
`,
    "utf8"
  );

  return {
    input: "src-es/index.js",

    output: {
      file: "dist/automerge-es.min.js",
      format: "esm",
      sourcemap: true,
      freeze: false
    },

    external: id => !id.startsWith("."),

    plugins: [
      resolve(),
      terser({
        // If this is not disabled, errors saying things are readonly will be
        // thrown when running Automerge.from under certain environments
        // (Metro or Jest).
        mangle: false
      }),
      emitTypeDefinitionsPlugin()
    ]
  };
}

function emitTypeDefinitionsPlugin() {
  return {
    name: "emit-type-definitions",
    writeBundle: () => {
      const automergeTypeDefinitions = fs.readFileSync(
        path.join(__dirname, "@types/automerge/index.d.ts"),
        "utf8"
      );

      const automergeEsTypeDefinitions = automergeTypeDefinitions.replace(
        /declare +module +['"]automerge['"]/,
        "declare module 'automerge-es'"
      );

      fs.writeFileSync(
        path.join(__dirname, "dist/automerge-es.d.ts"),
        automergeEsTypeDefinitions,
        "utf8"
      );
    }
  };
}
