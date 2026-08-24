.PHONY: dev-backend dev-frontend test-backend test-frontend test docker docker-down docker-rebuild clean

dev-backend:
	@echo "======================================================"
	@echo " Starting Goldoni Calculator Backend Locally"
	@echo "======================================================"
	@echo " Listening on: http://localhost:8080"
	@echo " Health Check: http://localhost:8080/health"
	@echo "======================================================"
	cd backend && go run main.go

dev-frontend:
	@echo "======================================================"
	@echo " Starting Goldoni Calculator Frontend Locally"
	@echo "======================================================"
	@echo " URL:           http://localhost:5173"
	@echo " Backend Proxy: http://localhost:8080"
	@echo "======================================================"
	cd frontend && npm run dev

test-backend:
	@echo "======================================================"
	@echo " Running Backend Unit & HTTP Tests (with Coverage)"
	@echo "======================================================"
	cd backend && go test -cover -coverprofile=coverage.out ./...

test-frontend:
	@echo "======================================================"
	@echo " Running Frontend Vitest Suite (with Coverage)"
	@echo "======================================================"
	cd frontend && npm run test:coverage

test:
	@echo "======================================================"
	@echo " Executing Full-Stack Test Pipeline"
	@echo "======================================================"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "======================================================"
	@echo " All Backend & Frontend Tests Passed Successfully"
	@echo "======================================================"

docker:
	@echo "======================================================"
	@echo " Starting Goldoni Calculator via Docker Compose"
	@echo "======================================================"
	@echo " Frontend UI:  http://localhost:3000"
	@echo " Backend API:  http://localhost:8080"
	@echo " Health Check: http://localhost:8080/health"
	@echo "======================================================"
	docker compose up --build

docker-rebuild:
	@echo "======================================================"
	@echo " Clean Rebuilding Goldoni Calculator (No Cache)"
	@echo "======================================================"
	@echo " Frontend UI:  http://localhost:3000"
	@echo " Backend API:  http://localhost:8080"
	@echo " Health Check: http://localhost:8080/health"
	@echo "======================================================"
	docker compose build --no-cache && docker compose up --force-recreate

docker-down:
	@echo "======================================================"
	@echo " Stopping & Removing Containers and Networks"
	@echo "======================================================"
	docker compose down
	@echo " All containers stopped successfully."

clean:
	@echo "======================================================"
	@echo " Purging Containers, Volumes & Build/Test Artifacts"
	@echo "======================================================"
	docker compose down -v --remove-orphans
	@rm -f backend/coverage.out
	@rm -rf frontend/coverage frontend/dist
	@echo " Cleanup complete."
