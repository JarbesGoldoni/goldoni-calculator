package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORS(t *testing.T) {
	dummyHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	corsHandler := CORS(dummyHandler)

	tests := []struct {
		name           string
		method         string
		origin         string
		expectedOrigin string
		expectedStatus int
	}{
		{
			name:           "allowed origin port 3000",
			method:         http.MethodPost,
			origin:         "http://localhost:3000",
			expectedOrigin: "http://localhost:3000",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "allowed origin port 5173",
			method:         http.MethodPost,
			origin:         "http://localhost:5173",
			expectedOrigin: "http://localhost:5173",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "disallowed origin",
			method:         http.MethodPost,
			origin:         "http://evil.com",
			expectedOrigin: "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "options preflight allowed origin",
			method:         http.MethodOptions,
			origin:         "http://localhost:3000",
			expectedOrigin: "http://localhost:3000",
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "options preflight disallowed origin",
			method:         http.MethodOptions,
			origin:         "http://unknown.com",
			expectedOrigin: "",
			expectedStatus: http.StatusNoContent,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/api/add", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}
			rec := httptest.NewRecorder()

			corsHandler.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			originHeader := rec.Header().Get("Access-Control-Allow-Origin")
			if originHeader != tt.expectedOrigin {
				t.Errorf("expected Access-Control-Allow-Origin %q, got %q", tt.expectedOrigin, originHeader)
			}

			if tt.expectedOrigin != "" {
				methods := rec.Header().Get("Access-Control-Allow-Methods")
				if methods != "GET, POST, OPTIONS" {
					t.Errorf("expected Access-Control-Allow-Methods 'GET, POST, OPTIONS', got %q", methods)
				}
				headers := rec.Header().Get("Access-Control-Allow-Headers")
				if headers != "Content-Type" {
					t.Errorf("expected Access-Control-Allow-Headers 'Content-Type', got %q", headers)
				}
			}
		})
	}
}
