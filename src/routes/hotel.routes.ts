import { Router, Request, Response } from "express";
import { Client, Connection } from "@temporalio/client";

const hotelRouter = Router();

let temporalClientPromise: Promise<Client> | undefined;

async function getTemporalClient(): Promise<Client> {
  if (!temporalClientPromise) {
    temporalClientPromise = (async () => {
      const connection = await Connection.connect({
        address:
          process.env.TEMPORAL_ADDRESS ??
          "localhost:7233",
      });

      return new Client({
        connection,
        namespace:
          process.env.TEMPORAL_NAMESPACE ??
          "default",
      });
    })();
  }

  return temporalClientPromise;
}

function parsePrice(
  value: unknown
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return parsed;
}

hotelRouter.get(
  "/api/hotels",
  async (
    req: Request,
    res: Response
  ) => {
    const city = String(
      req.query.city ?? ""
    )
      .trim()
      .toLowerCase();

    if (!city) {
      return res.status(400).json({
        error:
          "city query parameter is required",
      });
    }

    const minPrice = parsePrice(
      req.query.minPrice
    );

    const maxPrice = parsePrice(
      req.query.maxPrice
    );

    if (
      req.query.minPrice !== undefined &&
      minPrice === undefined
    ) {
      return res.status(400).json({
        error:
          "minPrice must be a non-negative number",
      });
    }

    if (
      req.query.maxPrice !== undefined &&
      maxPrice === undefined
    ) {
      return res.status(400).json({
        error:
          "maxPrice must be a non-negative number",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      return res.status(400).json({
        error:
          "minPrice cannot be greater than maxPrice",
      });
    }

    try {
      const client = await getTemporalClient();

      const workflowId =
        `hotel-offers-${city}-${Date.now()}`;

      const result =
        await client.workflow.execute(
          "hotelOfferWorkflow",
          {
            args: [
              {
                city,
                minPrice,
                maxPrice,
              },
            ],

            taskQueue:
              process.env.TEMPORAL_TASK_QUEUE ??
              "hotel-offer-queue",

            workflowId,
          }
        );

      return res.json(result);
    } catch (error) {
      console.error(
        "Hotel workflow failed:",
        error
      );

      return res.status(502).json({
        error:
          "Unable to fetch hotel offers",

        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      });
    }
  }
);

export default hotelRouter;