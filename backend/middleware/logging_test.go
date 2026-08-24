package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLogging(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
	}{
		{"success status 200", http.StatusOK},
		{"error status 400", http.StatusBadRequest},
		{"error status 500", http.StatusInternalServerError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.statusCode)
			})

			loggedHandler := Logging(dummyHandler)

			req := httptest.NewRequest(http.MethodPost, "/api/add", nil)
			rec := httptest.NewRecorder()

			loggedHandler.ServeHTTP(rec, req)

			if rec.Code != tt.statusCode {
				t.Errorf("expected status %d, got %d", tt.statusCode, rec.Code)
			}
		})
	}
}
