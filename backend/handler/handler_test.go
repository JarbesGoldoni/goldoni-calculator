package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRoutes_Success(t *testing.T) {
	router := NewRouter()

	tests := []struct {
		name               string
		endpoint           string
		payload            CalculateRequest
		expectedStatusCode int
		expectedResult     float64
		expectedExpression string
	}{
		{
			name:               "Add: 1 + 2",
			endpoint:           "/api/add",
			payload:            CalculateRequest{Arguments: []float64{1, 2}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     3,
			expectedExpression: "1 + 2",
		},
		{
			name:               "Subtract: 5 - 3",
			endpoint:           "/api/subtract",
			payload:            CalculateRequest{Arguments: []float64{5, 3}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     2,
			expectedExpression: "5 - 3",
		},
		{
			name:               "Multiply: 4 * 5",
			endpoint:           "/api/multiply",
			payload:            CalculateRequest{Arguments: []float64{4, 5}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     20,
			expectedExpression: "4 * 5",
		},
		{
			name:               "Divide: 10 / 2",
			endpoint:           "/api/divide",
			payload:            CalculateRequest{Arguments: []float64{10, 2}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     5,
			expectedExpression: "10 / 2",
		},
		{
			name:               "Power: 2 ^ 10",
			endpoint:           "/api/power",
			payload:            CalculateRequest{Arguments: []float64{2, 10}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     1024,
			expectedExpression: "2 ^ 10",
		},
		{
			name:               "Sqrt: sqrt(25)",
			endpoint:           "/api/sqrt",
			payload:            CalculateRequest{Arguments: []float64{25}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     5,
			expectedExpression: "sqrt(25)",
		},
		{
			name:               "Percentage: 15%",
			endpoint:           "/api/percentage",
			payload:            CalculateRequest{Arguments: []float64{15}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     0.15,
			expectedExpression: "15%",
		},
		{
			name:               "Percentage: 0%",
			endpoint:           "/api/percentage",
			payload:            CalculateRequest{Arguments: []float64{0}},
			expectedStatusCode: http.StatusOK,
			expectedResult:     0,
			expectedExpression: "0%",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, err := json.Marshal(tt.payload)
			if err != nil {
				t.Fatalf("failed to marshal request: %v", err)
			}

			req := httptest.NewRequest(http.MethodPost, tt.endpoint, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatusCode {
				t.Fatalf("expected status %d, got %d. Body: %s", tt.expectedStatusCode, rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Result == nil {
				t.Fatalf("expected result %v, got nil", tt.expectedResult)
			}
			if math.Abs(*resp.Result-tt.expectedResult) > 1e-9 {
				t.Errorf("expected result %v, got %v", tt.expectedResult, *resp.Result)
			}
			if resp.Expression != tt.expectedExpression {
				t.Errorf("expected expression %q, got %q", tt.expectedExpression, resp.Expression)
			}
			if resp.Error != "" {
				t.Errorf("expected empty error, got %q", resp.Error)
			}
		})
	}
}

func TestRoutes_DomainErrors(t *testing.T) {
	router := NewRouter()

	tests := []struct {
		name               string
		endpoint           string
		payload            CalculateRequest
		expectedStatusCode int
		expectedError      string
		expectedExpression string
	}{
		{
			name:               "Division by zero",
			endpoint:           "/api/divide",
			payload:            CalculateRequest{Arguments: []float64{10, 0}},
			expectedStatusCode: http.StatusUnprocessableEntity,
			expectedError:      "division by zero",
			expectedExpression: "10 / 0",
		},
		{
			name:               "Square root of negative number",
			endpoint:           "/api/sqrt",
			payload:            CalculateRequest{Arguments: []float64{-4}},
			expectedStatusCode: http.StatusUnprocessableEntity,
			expectedError:      "square root of negative number",
			expectedExpression: "sqrt(-4)",
		},
		{
			name:               "Result overflow multiply",
			endpoint:           "/api/multiply",
			payload:            CalculateRequest{Arguments: []float64{1e308, 1e308}},
			expectedStatusCode: http.StatusUnprocessableEntity,
			expectedError:      "result overflow",
			expectedExpression: "1e+308 * 1e+308",
		},
		{
			name:               "Result overflow power",
			endpoint:           "/api/power",
			payload:            CalculateRequest{Arguments: []float64{1e308, 2}},
			expectedStatusCode: http.StatusUnprocessableEntity,
			expectedError:      "result overflow",
			expectedExpression: "1e+308 ^ 2",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, err := json.Marshal(tt.payload)
			if err != nil {
				t.Fatalf("failed to marshal request: %v", err)
			}

			req := httptest.NewRequest(http.MethodPost, tt.endpoint, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatusCode {
				t.Fatalf("expected status %d, got %d. Body: %s", tt.expectedStatusCode, rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Result != nil {
				t.Errorf("expected result to be nil, got %v", *resp.Result)
			}
			if resp.Error != tt.expectedError {
				t.Errorf("expected error %q, got %q", tt.expectedError, resp.Error)
			}
			if resp.Expression != tt.expectedExpression {
				t.Errorf("expected expression %q, got %q", tt.expectedExpression, resp.Expression)
			}
		})
	}
}

func TestRoutes_InputValidationErrors(t *testing.T) {
	router := NewRouter()

	tests := []struct {
		name               string
		endpoint           string
		rawJSON            string
		expectedStatusCode int
		expectedError      string
	}{
		{
			name:               "Expected 2 arguments, got 3",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [1, 2, 3]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "expected 2 arguments, got 3",
		},
		{
			name:               "Expected 2 arguments, got 1",
			endpoint:           "/api/subtract",
			rawJSON:            `{"arguments": [5]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "expected 2 arguments, got 1",
		},
		{
			name:               "Expected 1 argument, got 2",
			endpoint:           "/api/sqrt",
			rawJSON:            `{"arguments": [25, 4]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "expected 1 arguments, got 2",
		},
		{
			name:               "Expected 1 argument, got 0",
			endpoint:           "/api/percentage",
			rawJSON:            `{"arguments": []}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "expected 1 arguments, got 0",
		},
		{
			name:               "Malformed JSON syntax",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [1, 2`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "malformed JSON",
		},
		{
			name:               "Invalid JSON type for arguments",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": "invalid"}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "malformed JSON",
		},
		{
			name:               "Empty body",
			endpoint:           "/api/add",
			rawJSON:            ``,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "malformed JSON",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, tt.endpoint, strings.NewReader(tt.rawJSON))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatusCode {
				t.Fatalf("expected status %d, got %d. Body: %s", tt.expectedStatusCode, rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Result != nil {
				t.Errorf("expected result to be nil, got %v", *resp.Result)
			}
			if resp.Expression != "" {
				t.Errorf("expected expression to be empty, got %q", resp.Expression)
			}
			if resp.Error != tt.expectedError {
				t.Errorf("expected error %q, got %q", tt.expectedError, resp.Error)
			}
		})
	}
}

func TestRoutes_NaNAndInfValidation(t *testing.T) {
	router := NewRouter()

	tests := []struct {
		name               string
		endpoint           string
		rawJSON            string
		expectedStatusCode int
		expectedError      string
	}{
		{
			name:               "Positive Infinity float argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [1e309, 2]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "invalid argument: NaN and Infinity are not allowed",
		},
		{
			name:               "Negative Infinity float argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [1, -1e309]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "invalid argument: NaN and Infinity are not allowed",
		},
		{
			name:               "String NaN argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": ["NaN", 2]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "invalid argument: NaN and Infinity are not allowed",
		},
		{
			name:               "String Infinity argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [1, "Infinity"]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "invalid argument: NaN and Infinity are not allowed",
		},
		{
			name:               "Boolean argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [true, 2]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "malformed JSON",
		},
		{
			name:               "Null argument",
			endpoint:           "/api/add",
			rawJSON:            `{"arguments": [null, 2]}`,
			expectedStatusCode: http.StatusBadRequest,
			expectedError:      "malformed JSON",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, tt.endpoint, strings.NewReader(tt.rawJSON))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != tt.expectedStatusCode {
				t.Fatalf("expected status %d, got %d. Body: %s", tt.expectedStatusCode, rec.Code, rec.Body.String())
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Error != tt.expectedError {
				t.Errorf("expected error %q, got %q", tt.expectedError, resp.Error)
			}
		})
	}
}

func TestBuildExpression_GenericUnaryAndFallback(t *testing.T) {
	exprUnary := buildExpression("abs", []float64{-5})
	if exprUnary != "abs(-5)" {
		t.Errorf("expected 'abs(-5)', got %q", exprUnary)
	}

	exprEmpty := buildExpression("+", []float64{})
	if exprEmpty != "" {
		t.Errorf("expected '', got %q", exprEmpty)
	}
}

func TestRoutes_TrailingLargeBody(t *testing.T) {
	router := NewRouter()

	body := `{"arguments": [1, 2]}` + strings.Repeat(" ", 2048)

	req := httptest.NewRequest(http.MethodPost, "/api/add", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected status 413, got %d", rec.Code)
	}
}

func TestRoutes_ContentTypeValidation(t *testing.T) {
	router := NewRouter()

	tests := []struct {
		name        string
		contentType string
	}{
		{"missing content-type", ""},
		{"text/plain", "text/plain"},
		{"application/xml", "application/xml"},
		{"multipart/form-data", "multipart/form-data"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body := `{"arguments": [1, 2]}`
			req := httptest.NewRequest(http.MethodPost, "/api/add", strings.NewReader(body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}
			rec := httptest.NewRecorder()

			router.ServeHTTP(rec, req)

			if rec.Code != http.StatusUnsupportedMediaType {
				t.Fatalf("expected status 415, got %d", rec.Code)
			}

			var resp CalculateResponse
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if resp.Error != "Content-Type must be application/json" {
				t.Errorf("expected error 'Content-Type must be application/json', got %q", resp.Error)
			}
		})
	}

	t.Run("application/json with charset utf-8", func(t *testing.T) {
		body := `{"arguments": [1, 2]}`
		req := httptest.NewRequest(http.MethodPost, "/api/add", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json; charset=utf-8")
		rec := httptest.NewRecorder()

		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("expected status 200, got %d", rec.Code)
		}
	})
}

func TestRoutes_PayloadTooLarge(t *testing.T) {
	router := NewRouter()

	padding := strings.Repeat(" ", 2048)
	largeBody := fmt.Sprintf(`{"arguments": [1, 2], "padding": "%s"}`, padding)

	req := httptest.NewRequest(http.MethodPost, "/api/add", strings.NewReader(largeBody))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected status 413, got %d. Body: %s", rec.Code, rec.Body.String())
	}

	var resp CalculateResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "request body too large" {
		t.Errorf("expected error 'request body too large', got %q", resp.Error)
	}
}

func TestRoutes_Health(t *testing.T) {
	router := NewRouter()

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var health HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&health); err != nil {
		t.Fatalf("failed to decode health response: %v", err)
	}

	if health.Status != "ok" {
		t.Errorf("expected health status 'ok', got %q", health.Status)
	}
}

func TestRoutes_NotFound(t *testing.T) {
	router := NewRouter()

	req := httptest.NewRequest(http.MethodPost, "/api/unknown", strings.NewReader(`{"arguments": [1, 2]}`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected status 404, got %d", rec.Code)
	}
}

func TestMakeHandler_UnaryOverflow(t *testing.T) {
	overflowUnary := func(v float64) (float64, error) {
		return math.Inf(1), nil
	}
	h := MakeHandler("overflow", 1, overflowUnary)

	body := `{"arguments": [10]}`
	req := httptest.NewRequest(http.MethodPost, "/api/overflow", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected status 422, got %d", rec.Code)
	}

	var resp CalculateResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Error != "result overflow" {
		t.Errorf("expected error 'result overflow', got %q", resp.Error)
	}
}

func TestMakeHandler_Panics(t *testing.T) {
	t.Run("invalid expectedArgs", func(t *testing.T) {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for expectedArgs 3")
			}
		}()
		MakeHandler("+", 3, func(a, b, c float64) (float64, error) { return 0, nil })
	})

	t.Run("invalid unary function signature", func(t *testing.T) {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for invalid unary function")
			}
		}()
		MakeHandler("sqrt", 1, "not a function")
	})

	t.Run("invalid binary function signature", func(t *testing.T) {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for invalid binary function")
			}
		}()
		MakeHandler("+", 2, "not a function")
	})
}
