import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { initDB } from "./db";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issues/issue.route";
import cors from "cors";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

const app: Application = express();

app.use(cors());
app.use(express.json());

initDB();

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "DevPulse server...",
  });
});

//* global error handler
app.use(globalErrorHandler);

//* not found handler
app.use(notFoundHandler);
export default app;
