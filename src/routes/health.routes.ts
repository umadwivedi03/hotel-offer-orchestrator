import { Router } from 'express';
import { pingRedis } from '../activities/redis.activities';

export const healthRouter = Router();

async function checkSupplier(url: string): Promise<'up' | 'down'> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`${url}?city=delhi`, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
}

healthRouter.get('/health', async (_req, res) => {
  const [supplierA, supplierB, redis] = await Promise.all([
    checkSupplier(process.env.SUPPLIER_A_URL ?? 'http://localhost:3000/supplierA/hotels'),
    checkSupplier(process.env.SUPPLIER_B_URL ?? 'http://localhost:3000/supplierB/hotels'),
    pingRedis()
  ]);

  const healthy = supplierA === 'up' && supplierB === 'up' && redis === 'up';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    suppliers: { supplierA, supplierB },
    redis
  });
});
