package handler

import (
	"net/http"

	"backend/middleware"
	"backend/operations"
)

func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/add", MakeHandler("+", 2, operations.Add))
	mux.HandleFunc("POST /api/subtract", MakeHandler("-", 2, operations.Subtract))
	mux.HandleFunc("POST /api/multiply", MakeHandler("*", 2, operations.Multiply))
	mux.HandleFunc("POST /api/divide", MakeHandler("/", 2, operations.Divide))
	mux.HandleFunc("POST /api/power", MakeHandler("^", 2, operations.Power))
	mux.HandleFunc("POST /api/sqrt", MakeHandler("sqrt", 1, operations.Sqrt))
	mux.HandleFunc("POST /api/percentage", MakeHandler("%", 1, operations.Percentage))
	mux.HandleFunc("GET /health", HealthHandler)
}

func NewRouter() http.Handler {
	mux := http.NewServeMux()
	RegisterRoutes(mux)
	return middleware.CORS(middleware.Logging(mux))
}
