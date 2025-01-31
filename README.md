
## To Dockerize the backend

Build Docker Image (for Express app):
```
docker-compose build
```

Start the services:
```
docker-compose up -d
```

Check the running containers:
```
docker ps
```

Check if PostgreSQL is running:
```
docker exec -it postgres psql -U postgres -d mydatabase
```
You can run SQL commands, such as:
```
SELECT COUNT(*) FROM transactions;
```

Check if Redis is running:
```
docker exec -it redis redis-cli
```
Test the Redis: 
```
PING
```

Check if the backend is running: Visit http://localhost:4242/api/health to confirm the API is working (depending on your API routes).

Remove named volume (for cleanup): 
```
docker volume rm backend_postgres_data
```