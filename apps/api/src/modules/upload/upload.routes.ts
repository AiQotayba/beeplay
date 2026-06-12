import { Router } from "express";
import { authenticate, type AuthRequest } from "../../middlewares/auth";
import { fileUploadMiddleware, imageUploadMiddleware } from "../../middlewares/upload";
import { sendError } from "../../utils/response";
import * as ctrl from "./upload.controller";

const router = Router();

router.post("/image", authenticate, (req, res) => {
  imageUploadMiddleware(req, res, (err) => {
    if (err) {
      const message = err instanceof Error ? err.message : "فشل رفع الصورة";
      return sendError(res, message, 400);
    }
    return ctrl.uploadImage(req as AuthRequest, res);
  });
});

router.post("/file", authenticate, (req, res) => {
  fileUploadMiddleware(req, res, (err) => {
    if (err) {
      const message = err instanceof Error ? err.message : "فشل رفع الملف";
      return sendError(res, message, 400);
    }
    return ctrl.uploadFile(req as AuthRequest, res);
  });
});

export default router;
