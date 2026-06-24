import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const httpLogger = pinoHttp({
  logger,
  serializers: {
    req(req: { id: unknown; method: string; url?: string }) {
      return {
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      };
    },
    res(res: { statusCode: number }) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

// Wrap pino-http to be compatible with Express v5 types
app.use((req: Request, res: Response, next: NextFunction) => {
  httpLogger(req as any, res as any);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
