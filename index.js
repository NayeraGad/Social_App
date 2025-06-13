import express from "express";
import bootstrap from "./src/app.controller.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve("config/.env") });

const app = express();
const port = process.env.PORT || 3001;

bootstrap(app, express);

app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}/`)
);
