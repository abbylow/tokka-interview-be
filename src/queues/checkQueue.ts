import { Queue } from 'bullmq';

async function checkQueue() {
  const transactionQueue = new Queue('transaction-queue');

  // Get job counts
  const jobCounts = await transactionQueue.getJobCounts();
  console.log('Job Counts:', jobCounts);

  // Get all waiting jobs
//   const waitingJobs = await transactionQueue.getWaiting();
//   console.log('Waiting Jobs:', waitingJobs);

  // Get all active jobs
  const activeJobs = await transactionQueue.getActive();
  console.log('Active Jobs:', activeJobs);
}

checkQueue();