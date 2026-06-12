import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import { UPLOADS_ROOT } from "../utils/uploads-path";

export { UPLOADS_ROOT };
const IMAGES_DIR = path.join(UPLOADS_ROOT, "images");
const FILES_DIR = path.join(UPLOADS_ROOT, "files");

export const IMAGES_SUBDIR = "images";
export const FILES_SUBDIR = "files";

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_FILE_MIMES = new Set(["application/pdf"]);

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

ensureDir(IMAGES_DIR);
ensureDir(FILES_DIR);

function getExtension(mimetype: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[mimetype] ?? "";
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir(IMAGES_DIR);
    cb(null, IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = getExtension(file.mimetype) || ".jpg";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir(FILES_DIR);
    cb(null, FILES_DIR);
  },
  filename: (_req, file, cb) => {
    const ext =
      getExtension(file.mimetype) || path.extname(file.originalname).toLowerCase() || ".bin";
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const imageUploadMiddleware = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      cb(new Error("يُسمح فقط بصور JPG أو PNG أو WebP أو GIF"));
      return;
    }
    cb(null, true);
  },
}).single("image");

export const fileUploadMiddleware = multer({
  storage: fileStorage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
}).single("file");
