import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";

dotenv.config({ debug: true, path: `.env.local` });

export default async function main() {
  const URL = `${
    process.env.CORE_URL ?? process.env.NEXT_PUBLIC_CORE_URL
  }/openapi.json`;

  const response = await fetch(URL);
  const file = await response.json();

  const directoryPath = path.join(process.cwd(), "src", "generated", "api");
  const filePath = path.join(directoryPath, "openapi.json");

  // Create directory if it doesn't exist
  await fs.mkdir(directoryPath, { recursive: true });

  // Write file
  // Dev-only codegen: persists the operator's own OpenAPI document (fetched
  // from CORE_URL) to a fixed in-repo path - no third-party input.
  // codeql[js/http-to-file-access]
  await fs.writeFile(filePath, JSON.stringify(file, null, 2));
  console.log("Successfully created openapi.json");
}

main();
