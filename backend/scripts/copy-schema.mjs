import fs from "node:fs";
import path from "node:path";

const source = path.resolve("src/db/schema.sql");
const destinationDir = path.resolve("dist/db");
const destination = path.join(destinationDir, "schema.sql");

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`Copied schema.sql -> ${destination}`);
