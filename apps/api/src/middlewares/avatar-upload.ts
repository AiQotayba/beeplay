import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";
import { UPLOADS_ROOT } from "../utils/uploads-path";
const AVATARS_DIR = path.join(UPLOADS_ROOT, "avatars");

fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

export const avatarUploadMiddleware = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new Error("يُسمح فقط بصور JPG أو PNG أو WebP أو GIF"));
      return;
    }
    cb(null, true);
  },
}).single("avatar");
