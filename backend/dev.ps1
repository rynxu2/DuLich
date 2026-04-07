# ===========================================================
# dev.ps1 — Travel Platform Docker Management (Windows)
# ===========================================================
# Usage: .\dev.ps1 <command>
#   .\dev.ps1 infra      — Start DB, Redis, RabbitMQ, MinIO
#   .\dev.ps1 core       — Start infra + core services
#   .\dev.ps1 full       — Start everything
#   .\dev.ps1 down       — Stop all containers
#   .\dev.ps1 stats      — Show resource usage
#   .\dev.ps1 help       — Show all commands
# ===========================================================

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Service = ""
)

$INFRA    = "--profile", "infra"
$CORE     = "--profile", "infra", "--profile", "core"
$FULL     = "--profile", "infra", "--profile", "core", "--profile", "advanced"
$SEARCH   = "--profile", "infra", "--profile", "core", "--profile", "advanced", "--profile", "search"

function Write-Header($msg) {
    Write-Host ""
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ""
}

switch ($Command.ToLower()) {
    # ── Startup ──
    "infra" {
        Write-Header "Starting Infrastructure (PostgreSQL, Redis, RabbitMQ, MinIO)..."
        docker compose @INFRA up -d
        Write-Host "  PostgreSQL :5432 | Redis :6379 | RabbitMQ :5672 | MinIO :9000" -ForegroundColor Green
    }
    "core" {
        Write-Header "Starting Core Services (infra + gateway + 5 services)..."
        docker compose @CORE up -d --build
        Write-Host "  Gateway :8080 | Eureka :8761" -ForegroundColor Green
    }
    "full" {
        Write-Header "Starting Full Stack (14 services + infra)..."
        docker compose @FULL up -d --build
        Write-Host "  All services started!" -ForegroundColor Green
    }
    "full-search" {
        Write-Header "Starting Full Stack + Elasticsearch..."
        docker compose @SEARCH up -d --build
        Write-Host "  All services + ES started!" -ForegroundColor Green
    }

    # ── Stop ──
    "down" {
        Write-Header "Stopping all containers..."
        docker compose @FULL down
    }
    "reset" {
        Write-Header "Stopping all containers and removing volumes..."
        docker compose @FULL down -v
        Write-Host "  All volumes removed!" -ForegroundColor Yellow
    }

    # ── Monitor ──
    "stats" {
        docker stats --format "table {{.Name}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.MemPerc}}"
    }
    "snap" {
        docker stats --no-stream --format "table {{.Name}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.MemPerc}}"
    }
    "ps" {
        docker compose @FULL ps
    }

    # ── Logs ──
    "logs" {
        if ($Service) {
            docker compose logs -f --tail=100 $Service
        } else {
            docker compose @FULL logs -f --tail=50
        }
    }

    # ── Build ──
    "rebuild" {
        if (-not $Service) {
            Write-Host "  Usage: .\dev.ps1 rebuild <service-name>" -ForegroundColor Red
            return
        }
        Write-Header "Rebuilding $Service..."
        docker compose up -d --build --no-deps $Service
    }

    # ── Access ──
    "psql"      { docker exec -it postgres psql -U dulich }
    "redis"     { docker exec -it redis redis-cli -a dulich_secret }
    "rabbit"    { Start-Process "http://localhost:15672" }
    "minio"     { Start-Process "http://localhost:9001" }
    "eureka"    { Start-Process "http://localhost:8761" }

    # ── RAM Summary ──
    "ram" {
        Write-Header "RAM Usage Summary"
        $stats = docker stats --no-stream --format "{{.Name}},{{.MemUsage}}" 2>$null
        $totalMB = 0
        foreach ($line in $stats) {
            $parts = $line -split ","
            $name = $parts[0]
            $mem = $parts[1]
            $match = [regex]::Match($mem, '([\d.]+)MiB')
            if ($match.Success) {
                $mb = [double]$match.Groups[1].Value
                $totalMB += $mb
                $bar = "█" * [math]::Min([int]($mb / 10), 30)
                Write-Host ("  {0,-25} {1,8} {2}" -f $name, $mem.Split("/")[0].Trim(), $bar)
            }
        }
        Write-Host ""
        Write-Host ("  TOTAL: {0:N0} MB / 8,192 MB ({1:N1}%)" -f $totalMB, ($totalMB / 8192 * 100)) -ForegroundColor Yellow
        Write-Host ("  FREE:  {0:N0} MB" -f (8192 - $totalMB)) -ForegroundColor Green
    }

    # ── Help ──
    default {
        Write-Host ""
        Write-Host "  ═══════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "   Travel Platform — Docker Management" -ForegroundColor White
        Write-Host "  ═══════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  STARTUP:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 infra           Start DB/Redis/RabbitMQ/MinIO"
        Write-Host "    .\dev.ps1 core            Start infra + core (7 services)"
        Write-Host "    .\dev.ps1 full            Start all 14 services"
        Write-Host "    .\dev.ps1 full-search     Start all + Elasticsearch"
        Write-Host ""
        Write-Host "  STOP:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 down            Stop all containers"
        Write-Host "    .\dev.ps1 reset           Stop + delete all data"
        Write-Host ""
        Write-Host "  MONITOR:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 stats           Live CPU/RAM usage"
        Write-Host "    .\dev.ps1 snap            One-shot snapshot"
        Write-Host "    .\dev.ps1 ram             RAM summary with chart"
        Write-Host "    .\dev.ps1 ps              Container status"
        Write-Host ""
        Write-Host "  LOGS:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 logs            Follow all logs"
        Write-Host "    .\dev.ps1 logs <service>  Follow specific service"
        Write-Host ""
        Write-Host "  BUILD:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 rebuild <svc>   Rebuild one service"
        Write-Host ""
        Write-Host "  ACCESS:" -ForegroundColor Yellow
        Write-Host "    .\dev.ps1 psql            PostgreSQL shell"
        Write-Host "    .\dev.ps1 redis           Redis shell"
        Write-Host "    .\dev.ps1 rabbit          RabbitMQ dashboard"
        Write-Host "    .\dev.ps1 eureka          Eureka dashboard"
        Write-Host ""
    }
}
