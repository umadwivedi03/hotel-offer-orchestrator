import { SupplierHotel } from '../types/hotel';

async function fetchSupplier(url: string): Promise<SupplierHotel[]> {
  const timeoutMs = Number(process.env.SUPPLIER_TIMEOUT_MS ?? 3000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Supplier returned HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) throw new Error('Supplier response is not an array');
    return data as SupplierHotel[];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchSupplierA(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier(`${process.env.SUPPLIER_A_URL ?? 'http://api:3000/supplierA/hotels'}?city=${encodeURIComponent(city)}`);
}

export async function fetchSupplierB(city: string): Promise<SupplierHotel[]> {
  return fetchSupplier(`${process.env.SUPPLIER_B_URL ?? 'http://api:3000/supplierB/hotels'}?city=${encodeURIComponent(city)}`);
}
