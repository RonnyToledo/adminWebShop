import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceDirectory = path.join(
  projectRoot,
  "node_modules",
  "maplibre-gl",
  "dist",
);
const destinationDirectory = path.join(projectRoot, "public", "maplibre");

await mkdir(destinationDirectory, { recursive: true });

for (const filename of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(
    path.join(sourceDirectory, filename),
    path.join(destinationDirectory, filename),
  );
}
