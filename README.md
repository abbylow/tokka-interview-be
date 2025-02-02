# Transaction Processing Backend
This project provides a backend service for syncing Uniswap V3
USDC/ETH pool transactions, serving transaction data through APIs, and processing real-time swap events from a blockchain network.

The focus is to obtain the transaction fee in USDT at the transaction time . 

## Features
- Sync historical transactions from a blockchain network.
- Listen to real-time events (in this case, Uniswap pool swap events).
- Serve RESTful APIs to query transactions and summaries.
- Process the data insertion tasks using BullMQ.
- Cache ETH price using Redis to avoid rate limit issues.

## Available Endpoints
### GET /api/health
Checks if the server is running.
### POST /api/transactions
Fetches filtered transactions with pagination.
### POST /api/transactions-summary
Returns a summary of transaction fees.
### POST /api/sync
Syncs transactions within a specified block range.


## Technologies Used
- Node.js with Express.js
- TypeScript
- PostgreSQL (transaction storage)
- Redis (for task queues and caching)
- BullMQ (task queue management)
- Ethers.js (blockchain interaction)

## Setup
1. Clone the Repository
    ```
    git clone <repository-url>
    cd <repository-folder>
    ```
2. Install Dependencies
    ```
    npm install
    ```
3. Set Up Environment Variables
    Create a .env.local file in the root directory and add the required environment variables. Refer to .env.example for guidance.

## Testing
Run unit tests with:

```
npm test
```

To run tests with coverage reporting:

```
npm run test:coverage
```

## Build and Run Instructions (with Docker)
This section provides instructions on how to build, run, and test the backend using Docker.

### Step 1: Build Docker Images
To build the Docker images for the services, run:
```
docker-compose build
```

Note: The frontend image should be built separately from the frontend repository [tokka-interview-fe](https://github.com/abbylow/tokka-interview-fe). Once built, this image will work with the backend system in this directory.


### Step 2: Start the Services
Start all services (Express backend, PostgreSQL, Redis, etc.) using:
```
docker-compose up -d
```
This will run the services in detached mode.

### Step 3: Verify Services
You can check the running containers with the following command:
```
docker ps
```

### Step 4: PostgreSQL Verification
To connect to the PostgreSQL service inside the container, use:
```
docker exec -it postgres psql -U postgres -d mydatabase
```
Once connected, you can run SQL commands to verify the database state, for example:

```
SELECT COUNT(*) FROM transactions;
```

### Step 5: Cache Verification
To check if Cache is running, execute:
```
docker exec -it redis-cache redis-cli
```
Inside the Redis CLI, test the connection by running:

```
PING
```
Redis should respond with PONG.

### Step 6: Check Queue Stats
To verify the task queue managed by Redis, run:
```
docker exec -it redis-queue redis-cli
```
You can inspect the Redis keys used by BullMQ by running:
```
keys *  # List all keys in Redis
```
For example, to check the count of waiting jobs in the transaction-queue, use:
```
llen bull:transaction-queue:waiting
```

### Step 7: API Verification
Ensure that the Express backend is running by visiting the following URL in your browser or using a tool like curl:

```
http://localhost:4242/api/health
```

You should see a response indicating that the server is running.

### Step 8: Logs and Monitoring
To monitor the logs of the Express backend service, use:

```
docker-compose logs -f express-app
```

### Step 9: Cleanup
To remove named volumes and clean up the database storage, run:

```
docker volume rm backend_postgres_data
```
You can also stop and remove all containers using:

```
docker-compose down
```

## Potential Improvements and Enhancements
1. Make this system capable of handling multiple liquidity pools

    Currently, the pool address is retrieved from the environment variable UNISWAP_POOL_ADDRESS. 
    
    To make the system more flexible and capable of handling multiple liquidity pools, we can enhance the /api/sync route to accept the pool address as part of the request body or as a route parameter. 
    
    To support multiple pools and maintain better data organization, we can enhance the application to dynamically store transactions in separate tables based on the pool address.

2. Potential Backend Architecture Enhancement
    
    The backend currently handles multiple responsibilities within a single service. In future iterations, it can be split into separate services:
    
    1. API Backend Service (Data Retrieval and API Handling): 
    - Serve API requests to read transaction data from the database.
    - Handle user-facing operations such as data filtering and pagination.

    2. Event Listener & Transaction Recorder:
    - Continuously listen for real-time events on the blockchain.
    - Synchronize historical transactions from the blockchain.

    3. Worker Service
    - Process queued messages for transaction data insertion.
    - Perform asynchronous tasks like caching and rate-limited API calls.

    This separation would allow for independent scaling, fault isolation, and better team collaboration.
