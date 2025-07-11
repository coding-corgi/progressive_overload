# progressive_overload\e2e.ps1

Write-Host "🧼 Cleaning up existing containers..."
docker-compose -f docker-compose.e2e.yml down

Write-Host "🔨 Rebuilding all images without cache..."
docker-compose -f docker-compose.e2e.yml build --no-cache

Write-Host "🚀 Starting services in background..."
docker-compose -f docker-compose.e2e.yml up -d

Write-Host "⏳ Waiting for containers to become healthy..."
Start-Sleep -Seconds 10

Write-Host "✅ Running E2E tests..."
docker-compose -f docker-compose.e2e.yml run --rm e2e-test-runner

Write-Host "🎉 Done!"
