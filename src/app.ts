import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { initDB } from "./db";
import { authRoute } from "./modules/auth/auth.route";
import { issueRoute } from "./modules/issues/issue.route";

const app: Application = express();

app.use(express.json());

initDB();

app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({
    message: "DevPulse server...",
  });
});

export default app;
