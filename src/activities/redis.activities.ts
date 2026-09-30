import Redis from 'ioredis';
import { HotelOffer } from '../types/hotel';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');

const indexKey = (city: string) => `hotels:${city}:price`;
const dataKey = (city: string, id: string) => `hotel:${city}:${id}`;

function safeId(name: string): string {
  return encodeURIComponent(name.toLowerCase().trim());
}

export async function saveHotelsToRedis(city: string, hotels: HotelOffer[]): Promise<void> {
  const index = indexKey(city);
  const previousIds = await redis.zrange(index, 0, -1);
  const tx = redis.multi();

  for (const id of previousIds) tx.del(dataKey(city, id));
  tx.del(index);

  for (const hotel of hotels) {
    const id = safeId(hotel.name);
    tx.set(dataKey(city, id), JSON.stringify(hotel));
    tx.zadd(index, hotel.price, id);
  }

  await tx.exec();
}

export async function getHotelsFromRedis(
  city: string,
  minPrice?: number,
  maxPrice?: number
): Promise<HotelOffer[]> {
  const index = indexKey(city);
  const min = minPrice ?? '-inf';
  const max = maxPrice ?? '+inf';
  const ids = await redis.zrangebyscore(index, min, max);
  if (!ids.length) return [];

  const values = await redis.mget(ids.map((id) => dataKey(city, id)));
  return values.filter((v): v is string => Boolean(v)).map((v) => JSON.parse(v) as HotelOffer);
}

export async function pingRedis(): Promise<'up' | 'down'> {
  try {
    await redis.ping();
    return 'up';
  } catch {
    return 'down';
  }
}
