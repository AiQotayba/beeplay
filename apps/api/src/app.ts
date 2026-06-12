import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { API_PREFIX } from "@beeplay/constants";
import { env } from "@beeplay/config";

import authRoutes from "./modules/auth/auth.routes";
import stadiumRoutes from "./modules/stadiums/stadiums.routes";
import bookingRoutes from "./modules/bookings/bookings.routes";
import reviewRoutes from "./modules/reviews/reviews.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import availabilityRoutes from "./modules/availability/availability.routes";
import userRoutes from "./modules/users/users.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import { UPLOADS_ROOT } from "./utils/uploads-path";

const app = express();

if (env.trustProxy !== false) {
  app.set("trust proxy", env.trustProxy);
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use("/uploads", express.static(UPLOADS_ROOT));
app.use(
  cors({
    origin: [env.corsOrigin, env.adminUrl, env.webUrl],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "طلبات كثيرة، حاول لاحقاً" },
  })
);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "BeePlay API", data: { status: "ok" } });
});

const api = express.Router();
api.use("/auth", authRoutes);
api.use("/stadiums", stadiumRoutes);
api.use("/bookings", bookingRoutes);
api.use("/reviews", reviewRoutes);
api.use("/notifications", notificationRoutes);
api.use("/analytics", analyticsRoutes);
api.use("/availability", availabilityRoutes);
api.use("/users", userRoutes);
api.use("/settings", settingsRoutes);
api.use("/upload", uploadRoutes);

app.use(API_PREFIX, api);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "المسار غير موجود" });
});

export default app;
