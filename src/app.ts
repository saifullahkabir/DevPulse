import express, { type Application, type Request, type Response } from "express";
import { initDB } from "./db";

const app: Application = express();

app.use(express.json());

initDB()

app.get("/", (req: Request, res: Response) => {
    return res.status(200).json({
        message: "DevPulse server..."
    })
})


export default app;