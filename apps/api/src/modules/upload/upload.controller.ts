import type { Response } from "express";
import { env } from "@beeplay/config";
import type { AuthRequest } from "../../middlewares/auth";
import { FILES_SUBDIR, IMAGES_SUBDIR } from "../../middlewares/upload";
import { sendError, sendSuccess } from "../../utils/response";

function uploadPublicUrl(subdir: string, filename: string) {
  const base =
    process.env.API_PUBLIC_URL?.replace(/\/$/, "") ?? `http://localhost:${env.apiPort}`;
  return `${base}/uploads/${subdir}/${filename}`;
}

export async function uploadImage(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return sendError(res, "اختر صورة للرفع. استخدم الحقل image", 400);
  }

  const url = uploadPublicUrl(IMAGES_SUBDIR, file.filename);
  return sendSuccess(res, { url }, "تم رفع الصورة", 201);
}

export async function uploadFile(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return sendError(res, "اختر ملفاً للرفع. استخدم الحقل file", 400);
  }

  const url = uploadPublicUrl(FILES_SUBDIR, file.filename);
  return sendSuccess(res, { url }, "تم رفع الملف", 201);
}
