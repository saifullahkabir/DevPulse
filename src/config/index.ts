import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  port: Number(process.env.PORT),
  connection_string: process.env.CONNECTION_STRING,
};

export default config;
