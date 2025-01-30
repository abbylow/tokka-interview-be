import express from 'express';
// import { getTransactions } from './services/transaction';

const router = express.Router();

// GET /health
router.get('/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});


// POST /transactions 
router.post('/transactions', async (req, res) => {
  try {
    // Destructure query and pagination parameters from the request body
    const { startTimestamp, endTimestamp, txHash, page = 1, limit = 50 } = req.body;
// console.log( startTimestamp, endTimestamp, txHash, page, limit)
    // Ensure valid numbers for page and limit
    const pageNumber = Number.isNaN(parseInt(page)) ? 1 : Math.max(parseInt(page, 10), 1);
    const pageSize = Number.isNaN(parseInt(limit)) ? 50 : Math.max(Math.min(parseInt(limit, 10), 100), 1); // Max limit = 100

    // Pagination calculation
    const offset = (pageNumber - 1) * pageSize;

    // Fetch transactions with the provided parameters
    // const transactions = await getTransactions(startTimestamp, endTimestamp, txHash, pageSize, offset);

    // mock data
    const transactions = [
      {
        "id": 1,
        "hash": "0x84db524cc750fe4d18a7d5ed5ecb67fd3cf2c183b8d3b0a1ab0dd07c054ce95c",
        "block_number": 1234567,
        "timestamp": 1738251010,
        "gas_used": 21000,
        "gas_price": 20000000000,
        "eth_fee": "0.000420000000000000",
        "eth_price_at_tx": "1800.123456",
        "usdt_fee": "0.756051",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x3e5fea857b46ca28603a870264a429f115ca2b07051a31e2b4bd4c59f684948e",
        "block_number": 10884836,
        "timestamp": 1738251010,
        "gas_used": 292642,
        "gas_price": 95584213589,
        "eth_fee": "0.027971955433112136",
        "eth_price_at_tx": "2547.924639",
        "usdt_fee": "71.270434",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x6594602ca3b0a4cf339a9334bcc224292f95fe8925b5049cd5ee84a476359b16",
        "block_number": 1655627,
        "timestamp": 1738251010,
        "gas_used": 500957,
        "gas_price": 133279505389,
        "eth_fee": "0.066767301181157271",
        "eth_price_at_tx": "2138.582111",
        "usdt_fee": "142.787356",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0xa34696c435dbbb5e3fc2eb42d8069868a4c16e8b67dd24df93031085a70f4089",
        "block_number": 2698128,
        "timestamp": 1738251010,
        "gas_used": 600777,
        "gas_price": 11190933293,
        "eth_fee": "0.006723255330968661",
        "eth_price_at_tx": "3478.054502",
        "usdt_fee": "23.383848",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x8457e8a3f4e7092e421bc410e62eccfb170b777218ab21ea23281ea94fa3963e",
        "block_number": 1027165,
        "timestamp": 1738251010,
        "gas_used": 814275,
        "gas_price": 165844093985,
        "eth_fee": "0.135042699629635859",
        "eth_price_at_tx": "2106.228824",
        "usdt_fee": "284.430826",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x84db524cc750fe4d18a7d5ed5ecb67fd3ct2c183b8d3b0a1ab0dd07c054ce95c",
        "block_number": 1234567,
        "timestamp": 1738251010,
        "gas_used": 21000,
        "gas_price": 20000000000,
        "eth_fee": "0.000420000000000000",
        "eth_price_at_tx": "1800.123456",
        "usdt_fee": "0.756051",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x3e5fea857b46ca28603a870264a429f115ca2b07051a31e2bebd4c59f684948e",
        "block_number": 10884836,
        "timestamp": 1738251010,
        "gas_used": 292642,
        "gas_price": 95584213589,
        "eth_fee": "0.027971955433112136",
        "eth_price_at_tx": "2547.924639",
        "usdt_fee": "71.270434",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x6594602ca3b0a4cf339a9334bcc22429wf95fe8925b5049cd5ee84a476359b16",
        "block_number": 1655627,
        "timestamp": 1738251010,
        "gas_used": 500957,
        "gas_price": 133279505389,
        "eth_fee": "0.066767301181157271",
        "eth_price_at_tx": "2138.582111",
        "usdt_fee": "142.787356",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0xa34696c435dbbb5e3fc2eb42q8069868a4c16e8b67dd24df93031085a70f4089",
        "block_number": 2698128,
        "timestamp": 1738251010,
        "gas_used": 600777,
        "gas_price": 11190933293,
        "eth_fee": "0.006723255330968661",
        "eth_price_at_tx": "3478.054502",
        "usdt_fee": "23.383848",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x8457e8a3f4e7092w421bc410e62eccfb170b777218ab21ea23281ea94fa3963e",
        "block_number": 1027165,
        "timestamp": 1738251010,
        "gas_used": 814275,
        "gas_price": 165844093985,
        "eth_fee": "0.135042699629635859",
        "eth_price_at_tx": "2106.228824",
        "usdt_fee": "284.430826",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x84db524cc750fe4de8a7d5ed5ecb67fd3cf2c183b8d3b0a1ab0dd07c054ce95c",
        "block_number": 1234567,
        "timestamp": 1738251010,
        "gas_used": 21000,
        "gas_price": 20000000000,
        "eth_fee": "0.000420000000000000",
        "eth_price_at_tx": "1800.123456",
        "usdt_fee": "0.756051",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x3e5fea857b46ca2860ta870264a429f115ca2b07051a31e2b4bd4c59f684948e",
        "block_number": 10884836,
        "timestamp": 1738251010,
        "gas_used": 292642,
        "gas_price": 95584213589,
        "eth_fee": "0.027971955433112136",
        "eth_price_at_tx": "2547.924639",
        "usdt_fee": "71.270434",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x6594602ca3b0a4cf339ae334bcc224292f95fe8925b5049cd5ee84a476359b16",
        "block_number": 1655627,
        "timestamp": 1738251010,
        "gas_used": 500957,
        "gas_price": 133279505389,
        "eth_fee": "0.066767301181157271",
        "eth_price_at_tx": "2138.582111",
        "usdt_fee": "142.787356",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0xa34696c435dbbb5e3fy2eb42d8069868a4c16e8b67dd24df93031085a70f4089",
        "block_number": 2698128,
        "timestamp": 1738251010,
        "gas_used": 600777,
        "gas_price": 11190933293,
        "eth_fee": "0.006723255330968661",
        "eth_price_at_tx": "3478.054502",
        "usdt_fee": "23.383848",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x8457e8a3f4e7092e42ebc410e62eccfb170b777218ab21ea23281ea94fa3963e",
        "block_number": 1027165,
        "timestamp": 1738251010,
        "gas_used": 814275,
        "gas_price": 165844093985,
        "eth_fee": "0.135042699629635859",
        "eth_price_at_tx": "2106.228824",
        "usdt_fee": "284.430826",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x84db524cc750fe4d18w7d5ed5ecb67fd3cf2c183b8d3b0a1ab0dd07c054ce95c",
        "block_number": 1234567,
        "timestamp": 1738251010,
        "gas_used": 21000,
        "gas_price": 20000000000,
        "eth_fee": "0.000420000000000000",
        "eth_price_at_tx": "1800.123456",
        "usdt_fee": "0.756051",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x3e5fea857b46ca28603a87q264a429f115ca2b07051a31e2b4bd4c59f684948e",
        "block_number": 10884836,
        "timestamp": 1738251010,
        "gas_used": 292642,
        "gas_price": 95584213589,
        "eth_fee": "0.027971955433112136",
        "eth_price_at_tx": "2547.924639",
        "usdt_fee": "71.270434",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x6594602ca3b0a4cf339a9q34bcc224292f95fe8925b5049cd5ee84a476359b16",
        "block_number": 1655627,
        "timestamp": 1738251010,
        "gas_used": 500957,
        "gas_price": 133279505389,
        "eth_fee": "0.066767301181157271",
        "eth_price_at_tx": "2138.582111",
        "usdt_fee": "142.787356",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0xa34696c435dbbb5e3fc2eb42dw069868a4c16e8b67dd24df93031085a70f4089",
        "block_number": 2698128,
        "timestamp": 1738251010,
        "gas_used": 600777,
        "gas_price": 11190933293,
        "eth_fee": "0.006723255330968661",
        "eth_price_at_tx": "3478.054502",
        "usdt_fee": "23.383848",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x8457e8a3f4e7092e421bc410ee2eccfb170b777218ab21ea23281ea94fa3963e",
        "block_number": 1027165,
        "timestamp": 1738251010,
        "gas_used": 814275,
        "gas_price": 165844093985,
        "eth_fee": "0.135042699629635859",
        "eth_price_at_tx": "2106.228824",
        "usdt_fee": "284.430826",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x84db524cc750fe4d18a7d5ed5ecbt7fd3cf2c183b8d3b0a1ab0dd07c054ce95c",
        "block_number": 1234567,
        "timestamp": 1738251010,
        "gas_used": 21000,
        "gas_price": 20000000000,
        "eth_fee": "0.000420000000000000",
        "eth_price_at_tx": "1800.123456",
        "usdt_fee": "0.756051",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x3e5fea857b46ca28603a870264a429y115ca2b07051a31e2b4bd4c59f684948e",
        "block_number": 10884836,
        "timestamp": 1738251010,
        "gas_used": 292642,
        "gas_price": 95584213589,
        "eth_fee": "0.027971955433112136",
        "eth_price_at_tx": "2547.924639",
        "usdt_fee": "71.270434",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x6594602ca3b0a4cf339a9334bcc22u292f95fe8925b5049cd5ee84a476359b16",
        "block_number": 1655627,
        "timestamp": 1738251010,
        "gas_used": 500957,
        "gas_price": 133279505389,
        "eth_fee": "0.066767301181157271",
        "eth_price_at_tx": "2138.582111",
        "usdt_fee": "142.787356",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0xa34696c435dbbb5e3fc2eb42d8069868a4c16e8u67dd24df93031085a70f4089",
        "block_number": 2698128,
        "timestamp": 1738251010,
        "gas_used": 600777,
        "gas_price": 11190933293,
        "eth_fee": "0.006723255330968661",
        "eth_price_at_tx": "3478.054502",
        "usdt_fee": "23.383848",
        "processed_at": 1738251010
      },
      {
        "id": 1,
        "hash": "0x8457e8a3f4e7092e421bc410e62eccfb170b7772w8ab21ea23281ea94fa3963e",
        "block_number": 1027165,
        "timestamp": 1738251010,
        "gas_used": 814275,
        "gas_price": 165844093985,
        "eth_fee": "0.135042699629635859",
        "eth_price_at_tx": "2106.228824",
        "usdt_fee": "284.430826",
        "processed_at": 1738251010
      }
    ]

    res.json({
      currentPage: pageNumber,
      pageSize: pageSize,
      totalCount: transactions.length,
      transactions: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
