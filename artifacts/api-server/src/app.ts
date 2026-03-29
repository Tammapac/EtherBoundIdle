import express, { type Express, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

  app.use(cors({
  credentials: true,
  origin: process.env.CORS_ORIGIN || "http://46.224.121.242:3000",
}));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", (req, res, next) => {
  if (
    req.path.startsWith("/auth/login") ||
    req.path.startsWith("/auth/register")
  ) {
    return next(); // ❗ diese brauchen KEINE auth
  }
  return authMiddleware(req, res, next);
});

app.use("/api", router);

const publicDir = path.resolve(__dirname, "public");
const indexPath = path.join(publicDir, "index.html");
logger.info({ publicDir, indexExists: fs.existsSync(indexPath) }, "Static file serving configured");
app.use(express.static(publicDir));
app.get("/{*splat}", (req: Request, res: Response) => {
  if (req.path.startsWith("/api")) return;
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send("Frontend not built. Run: cd artifacts/game && npx vite build && cd ../api-server && node build.mjs");
  }
});

export default app;
