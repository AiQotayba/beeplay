import type { Response } from "express";
import fs from "fs";
import path from "path";
import { env } from "@beeplay/config";
import { prisma } from "../../db";
import { getPagination, buildMeta, buildTableOrderBy, omitPassword } from "@beeplay/utils";
import { userListQuerySchema } from "@beeplay/validation";
import { updateProfileSchema } from "@beeplay/validation";
import type { AuthRequest } from "../../middlewares/auth";
import { UPLOADS_ROOT } from "../../utils/uploads-path";
import { param } from "../../utils/params";
import { sendError, sendPaginated, sendSuccess } from "../../utils/response";

function avatarPublicUrl(filename: string) {
  const base =
    process.env.API_PUBLIC_URL?.replace(/\/$/, "") ?? `http://localhost:${env.apiPort}`;
  return `${base}/uploads/avatars/${filename}`;
}

function tryDeleteLocalAvatar(avatarUrl: string | null | undefined) {
  if (!avatarUrl) return;
  const marker = "/uploads/avatars/";
  const idx = avatarUrl.indexOf(marker);
  if (idx === -1) return;
  const filename = avatarUrl.slice(idx + marker.length);
  if (!filename || filename.includes("..")) return;
  const filePath = path.join(UPLOADS_ROOT, "avatars", filename);
  fs.unlink(filePath, () => undefined);
}

const USER_SORT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "role",
  "isBanned",
  "createdAt",
] as const;

export async function listUsers(req: AuthRequest, res: Response) {
  const query = userListQuerySchema.parse(req.query);
  const { page, limit, skip } = getPagination(query.page, query.limit);
  const { search, role, sort_field, sort_order } = query;

  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildTableOrderBy(sort_field, sort_order, USER_SORT_FIELDS, {
        createdAt: "desc",
      }),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        isBanned: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return sendPaginated(res, users, buildMeta(total, page, limit));
}

export async function updateUser(req: AuthRequest, res: Response) {
  const body = updateProfileSchema.parse(req.body);
  const id = param(req, "id") || req.user!.id;

  if (id !== req.user!.id && req.user!.role !== "ADMIN") {
    return sendError(res, "غير مصرح", 403);
  }

  if (body.avatar === null && id === req.user!.id) {
    const current = await prisma.user.findUnique({
      where: { id },
      select: { avatar: true },
    });
    tryDeleteLocalAvatar(current?.avatar);
  }

  const user = await prisma.user.update({
    where: { id },
    data: body,
  });
  return sendSuccess(res, omitPassword(user));
}

export async function uploadAvatar(req: AuthRequest, res: Response) {
  const file = req.file;
  if (!file) {
    return sendError(res, "اختر صورة للرفع", 400);
  }

  const current = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { avatar: true },
  });
  tryDeleteLocalAvatar(current?.avatar);

  const avatar = avatarPublicUrl(file.filename);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatar },
  });

  return sendSuccess(res, omitPassword(user), "تم تحديث الصورة الشخصية");
}

export async function banUser(req: AuthRequest, res: Response) {
  const { isBanned } = req.body as { isBanned: boolean };
  const user = await prisma.user.update({
    where: { id: param(req, "id") },
    data: { isBanned: !!isBanned },
    select: { id: true, email: true, isBanned: true },
  });
  return sendSuccess(res, user);
}

export async function changeRole(req: AuthRequest, res: Response) {
  const { role } = req.body as { role: "ADMIN" | "STADIUM_OWNER" | "USER" };
  const user = await prisma.user.update({
    where: { id: param(req, "id") },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  return sendSuccess(res, user);
}
