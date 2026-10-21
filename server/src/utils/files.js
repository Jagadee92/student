import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFolder = path.dirname(fileURLToPath(import.meta.url));
export const uploadRoot = path.resolve(currentFolder, "../../uploads");
export const photoFolder = path.join(uploadRoot, "photos");
export const documentFolder = path.join(uploadRoot, "documents");

export async function createUploadFolders() {
  await fs.mkdir(photoFolder, { recursive: true });
  await fs.mkdir(documentFolder, { recursive: true });
}

export async function deleteUpload(filePath) {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Could not remove an upload:", error.message);
    }
  }
}

export function getSavedFilePath(folder, savedName) {
  const safeName = path.basename(savedName || "");
  if (!safeName) return "";

  return path.join(folder, safeName);
}
