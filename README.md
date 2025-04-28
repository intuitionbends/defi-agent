# Defi Agent

## Migrations

```bash
npm run migrate:create --name=<migration_name>
npm run migrate:up
npm run migrate:down --count=<count>
npm run migrate:clean
```

## Start

### Dev

```bash
npm run langgraph:dev:start
npm run start
```

### Production

```bash
# build & start langgraph API server
docker build -t langgraph .Dockerfile.langgraph
docker run -p 8000:8000 -e LANGSMITH_API_KEY= -e DATABASE_URI= -e REDIS_URI= langgraph

docker build -t defi-agent .Dockerfile
docker run -p 8080:8080 defi-agent
```

\*using `docker-compose` coming soon
