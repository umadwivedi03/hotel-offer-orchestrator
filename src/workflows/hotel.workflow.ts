import { proxyActivities } from "@temporalio/workflow";

import type * as supplierActivities from "../activities/supplier.activities";
import type * as redisActivities from "../activities/redis.activities";

import type {
  HotelOffer,
  SupplierHotel,
} from "../types/hotel";

const {
  fetchSupplierA,
  fetchSupplierB,
} = proxyActivities<typeof supplierActivities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 2,
  },
});

const {
  saveHotelsToRedis,
  getHotelsFromRedis,
} = proxyActivities<typeof redisActivities>({
  startToCloseTimeout: "10 seconds",
  retry: {
    maximumAttempts: 2,
  },
});

export interface HotelWorkflowInput {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

function selectBest(
  supplierA: SupplierHotel[],
  supplierB: SupplierHotel[]
): HotelOffer[] {
  const byName = new Map<string, HotelOffer>();

  for (const hotel of supplierA) {
    const key = hotel.name.trim().toLowerCase();

    byName.set(key, {
      name: hotel.name,
      price: hotel.price,
      supplier: "Supplier A",
      commissionPct: hotel.commissionPct,
    });
  }

  for (const hotel of supplierB) {
    const key = hotel.name.trim().toLowerCase();

    const existing = byName.get(key);

    const candidate: HotelOffer = {
      name: hotel.name,
      price: hotel.price,
      supplier: "Supplier B",
      commissionPct: hotel.commissionPct,
    };

    if (!existing || candidate.price < existing.price) {
      byName.set(key, candidate);
    }
  }

  return Array.from(byName.values());
}

export async function hotelOfferWorkflow(
  input: HotelWorkflowInput
): Promise<HotelOffer[]> {
  const {
    city,
    minPrice,
    maxPrice,
  } = input;

  /*
   * Call Supplier A and Supplier B concurrently.
   *
   * Promise.allSettled allows one supplier to fail
   * without automatically cancelling the other result.
   */
  const [supplierAResult, supplierBResult] =
    await Promise.allSettled([
      fetchSupplierA(city),
      fetchSupplierB(city),
    ]);

  const supplierA =
    supplierAResult.status === "fulfilled"
      ? supplierAResult.value
      : [];

  const supplierB =
    supplierBResult.status === "fulfilled"
      ? supplierBResult.value
      : [];

  if (supplierAResult.status === "rejected") {
    console.error(
      "Supplier A failed:",
      supplierAResult.reason
    );
  }

  if (supplierBResult.status === "rejected") {
    console.error(
      "Supplier B failed:",
      supplierBResult.reason
    );
  }

  if (supplierA.length === 0 && supplierB.length === 0) {
    throw new Error(
      "Both suppliers failed or returned no results"
    );
  }

  /*
   * Deduplicate hotels and select cheapest offer.
   */
  const deduplicatedHotels = selectBest(
    supplierA,
    supplierB
  );

  /*
   * Save the final deduplicated list in Redis.
   */
  await saveHotelsToRedis(
    city,
    deduplicatedHotels
  );

  /*
   * If price filtering was requested,
   * Redis performs the filtering using ZRANGEBYSCORE.
   */
  if (
    minPrice !== undefined ||
    maxPrice !== undefined
  ) {
    return getHotelsFromRedis(
      city,
      minPrice,
      maxPrice
    );
  }

  return deduplicatedHotels;
}