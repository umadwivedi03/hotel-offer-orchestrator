import { Router } from 'express';
import { getSupplierHotels } from '../services/supplierData';

export const supplierRouter = Router();

supplierRouter.get('/supplierA/hotels', (req, res) => {
  const city = String(req.query.city ?? 'delhi').toLowerCase();
  res.json(getSupplierHotels('a', city));
});

supplierRouter.get('/supplierB/hotels', (req, res) => {
  const city = String(req.query.city ?? 'delhi').toLowerCase();
  res.json(getSupplierHotels('b', city));
});
