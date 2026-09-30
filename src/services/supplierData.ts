import { SupplierHotel } from '../types/hotel';

const DATA: Record<string, { a: SupplierHotel[]; b: SupplierHotel[] }> = {
  delhi: {
    a: [
      { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
      { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
      { hotelId: 'a3', name: 'Taj Palace', price: 8200, city: 'delhi', commissionPct: 12 }
    ],
    b: [
      { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
      { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 15 },
      { hotelId: 'b3', name: 'Imperial', price: 7500, city: 'delhi', commissionPct: 11 }
    ]
  },
  mumbai: {
    a: [
      { hotelId: 'a4', name: 'Sea View', price: 7000, city: 'mumbai', commissionPct: 9 },
      { hotelId: 'a5', name: 'Gateway Inn', price: 5100, city: 'mumbai', commissionPct: 12 }
    ],
    b: [
      { hotelId: 'b4', name: 'Sea View', price: 6800, city: 'mumbai', commissionPct: 14 },
      { hotelId: 'b5', name: 'Marine Hotel', price: 4900, city: 'mumbai', commissionPct: 10 }
    ]
  }
};

export function getSupplierHotels(supplier: 'a' | 'b', city: string): SupplierHotel[] {
  return DATA[city.toLowerCase()]?.[supplier] ?? [];
}

export function getSupportedCities(): string[] {
  return Object.keys(DATA);
}
