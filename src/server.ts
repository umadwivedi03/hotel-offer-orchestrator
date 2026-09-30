import express from "express";
import pinoHttp from "pino-http";

import hotelRouter from "./routes/hotel.routes";
import { supplierRouter } from "./routes/supplier.routes";
import { healthRouter } from "./routes/health.routes";

const app = express();

app.use(express.json());
app.use(pinoHttp());

app.use(supplierRouter);
app.use(hotelRouter);
app.use(healthRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      error: "Internal server error",
    });
  }
);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`API listening on ${port}`);
});