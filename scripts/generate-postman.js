const fs = require('fs');
const collection = {
  info: {
    name: 'Hotel Offer Orchestrator',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [{ key: 'baseUrl', value: 'http://localhost:3000' }],
  item: [
    { name: 'Hotels - Delhi', request: { method: 'GET', url: '{{baseUrl}}/api/hotels?city=delhi' } },
    { name: 'Hotels - Delhi Price Filter', request: { method: 'GET', url: '{{baseUrl}}/api/hotels?city=delhi&minPrice=5000&maxPrice=6000' } },
    { name: 'Hotels - No Results', request: { method: 'GET', url: '{{baseUrl}}/api/hotels?city=jaipur' } },
    { name: 'Supplier A', request: { method: 'GET', url: '{{baseUrl}}/supplierA/hotels?city=delhi' } },
    { name: 'Supplier B', request: { method: 'GET', url: '{{baseUrl}}/supplierB/hotels?city=delhi' } },
    { name: 'Health', request: { method: 'GET', url: '{{baseUrl}}/health' } }
  ]
};
fs.writeFileSync('Hotel-Offer-Orchestrator.postman_collection.json', JSON.stringify(collection, null, 2));
console.log('Postman collection created');
