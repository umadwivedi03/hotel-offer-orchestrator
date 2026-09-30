import { NativeConnection, Worker } from '@temporalio/worker';
import * as supplierActivities from './activities/supplier.activities';
import * as redisActivities from './activities/redis.activities';

async function run() {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? 'localhost:7233'
  });

  const worker = await Worker.create({
    connection,
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
    taskQueue: process.env.TEMPORAL_TASK_QUEUE ?? 'hotel-offer-queue',
    workflowsPath: require.resolve('./workflows/hotel.workflow'),
    activities: { ...supplierActivities, ...redisActivities }
  });

  console.log('Temporal worker started');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
