# ===========================================================
# Makefile — Travel Platform Docker Management
# ===========================================================
# Usage: make <target>
#   make infra      — Start DB, Redis, RabbitMQ, MinIO
#   make core       — Start infra + core services
#   make full       — Start everything
#   make down       — Stop all containers
#   make stats      — Show resource usage
# ===========================================================

.PHONY: infra core full down reset stats logs build clean prune

# ── Profiles ──
INFRA   = --profile infra
CORE    = --profile infra --profile core
FULL    = --profile infra --profile core --profile advanced
SEARCH  = --profile infra --profile core --profile advanced --profile search

# ═══════════════════════════════════════════════
#  STARTUP COMMANDS
# ═══════════════════════════════════════════════

## Start infrastructure only (DB, Redis, RabbitMQ, MinIO)
infra:
	docker compose $(INFRA) up -d
	@echo "✅ Infrastructure ready: PostgreSQL :5432 | Redis :6379 | RabbitMQ :5672/:15672 | MinIO :9000/:9001"

## Start core services (infra + gateway + auth/user/tour/booking/payment)
core:
	docker compose $(CORE) up -d --build
	@echo "✅ Core services ready: Gateway :8080 | Eureka :8761"

## Start all services including advanced
full:
	docker compose $(FULL) up -d --build
	@echo "✅ Full stack ready: 14 services + infrastructure"

## Start everything + Elasticsearch
full-search:
	docker compose $(SEARCH) up -d --build
	@echo "✅ Full stack + Elasticsearch ready"

# ═══════════════════════════════════════════════
#  STOP & CLEANUP
# ═══════════════════════════════════════════════

## Stop all running containers
down:
	docker compose $(FULL) $(SEARCH) down

## Stop and remove ALL data (volumes)
reset:
	docker compose $(FULL) $(SEARCH) down -v
	@echo "🗑️  All volumes removed"

## Remove dangling images and unused networks
prune:
	docker system prune -f
	docker image prune -f
	@echo "🧹 Cleaned up unused Docker resources"

# ═══════════════════════════════════════════════
#  MONITORING
# ═══════════════════════════════════════════════

## Show live resource usage (CPU, RAM) per container
stats:
	docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

## One-shot resource snapshot
stats-snap:
	docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

## Show running containers and their status
ps:
	docker compose $(FULL) ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# ═══════════════════════════════════════════════
#  LOGS
# ═══════════════════════════════════════════════

## Follow logs for all services
logs:
	docker compose $(FULL) logs -f --tail=50

## Follow logs for a specific service (usage: make log s=auth-service)
log:
	docker compose logs -f --tail=100 $(s)

# ═══════════════════════════════════════════════
#  BUILD
# ═══════════════════════════════════════════════

## Rebuild a specific service (usage: make rebuild s=auth-service)
rebuild:
	docker compose up -d --build --no-deps $(s)

## Rebuild all services (no cache)
build-all:
	docker compose $(FULL) build --no-cache

# ═══════════════════════════════════════════════
#  QUICK ACCESS
# ═══════════════════════════════════════════════

## Open RabbitMQ management UI
rabbit-ui:
	start http://localhost:15672

## Open MinIO console
minio-ui:
	start http://localhost:9001

## Open Eureka dashboard
eureka-ui:
	start http://localhost:8761

## Shell into PostgreSQL
psql:
	docker exec -it postgres psql -U dulich

## Shell into Redis
redis-cli:
	docker exec -it redis redis-cli -a dulich_secret

# ═══════════════════════════════════════════════
#  HELP
# ═══════════════════════════════════════════════

## Show available commands
help:
	@echo ""
	@echo "═══════════════════════════════════════════════"
	@echo " Travel Platform — Docker Management"
	@echo "═══════════════════════════════════════════════"
	@echo ""
	@echo " STARTUP:"
	@echo "   make infra       Start DB/Redis/RabbitMQ/MinIO only"
	@echo "   make core        Start infra + core (7 services)"
	@echo "   make full        Start all 14 services"
	@echo "   make full-search Start all + Elasticsearch"
	@echo ""
	@echo " STOP:"
	@echo "   make down        Stop all containers"
	@echo "   make reset       Stop + delete all data"
	@echo "   make prune       Clean unused Docker resources"
	@echo ""
	@echo " MONITOR:"
	@echo "   make stats       Live CPU/RAM usage"
	@echo "   make stats-snap  One-shot snapshot"
	@echo "   make ps          Container status"
	@echo ""
	@echo " LOGS:"
	@echo "   make logs            Follow all logs"
	@echo "   make log s=<name>    Follow specific service"
	@echo ""
	@echo " BUILD:"
	@echo "   make rebuild s=<name>  Rebuild one service"
	@echo "   make build-all         Rebuild everything"
	@echo ""
	@echo " ACCESS:"
	@echo "   make psql        PostgreSQL shell"
	@echo "   make redis-cli   Redis shell"
	@echo "   make rabbit-ui   RabbitMQ dashboard"
	@echo "   make eureka-ui   Eureka dashboard"
	@echo ""
