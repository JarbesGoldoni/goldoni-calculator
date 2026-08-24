package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/handler"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := handler.NewRouter()

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  120 * time.Second,
	}

	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		slog.Info("shutting down server...")

		shutdownCtx, shutdownCancel := context.WithTimeout(serverCtx, 10*time.Second)
		defer shutdownCancel()

		if err := server.Shutdown(shutdownCtx); err != nil {
			slog.Error("server forced to shutdown", slog.String("error", err.Error()))
		}
		serverStopCtx()
	}()

	fmt.Printf("======================================================\n")
	fmt.Printf(" Calculator Backend Microservice\n")
	fmt.Printf("======================================================\n")
	fmt.Printf(" Status:       READY\n")
	fmt.Printf(" Listening on: http://0.0.0.0:%s\n", port)
	fmt.Printf(" Health Check: http://0.0.0.0:%s/health\n", port)
	fmt.Printf(" Operations:   /api/add, /api/subtract, /api/multiply,\n")
	fmt.Printf("               /api/divide, /api/power, /api/sqrt,\n")
	fmt.Printf("               /api/percentage\n")
	fmt.Printf(" CORS:         http://localhost:3000, http://localhost:5173\n")
	fmt.Printf("======================================================\n")

	slog.Info("server starting", slog.String("port", port))
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		slog.Error("server failed to start", slog.String("error", err.Error()))
		os.Exit(1)
	}

	<-serverCtx.Done()
	slog.Info("server stopped gracefully")
}
