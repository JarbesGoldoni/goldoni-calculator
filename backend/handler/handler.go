package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"mime"
	"net/http"
	"strconv"
	"strings"
)

type CalculateRequest struct {
	Arguments []float64 `json:"arguments"`
}

type CalculateResponse struct {
	Result     *float64 `json:"result,omitempty"`
	Expression string   `json:"expression,omitempty"`
	Error      string   `json:"error,omitempty"`
}

func formatNumber(n float64) string {
	return strconv.FormatFloat(n, 'g', -1, 64)
}

func buildExpression(symbol string, args []float64) string {
	if len(args) == 1 {
		if symbol == "%" {
			return formatNumber(args[0]) + "%"
		}
		if symbol == "sqrt" {
			return fmt.Sprintf("sqrt(%s)", formatNumber(args[0]))
		}
		return fmt.Sprintf("%s(%s)", symbol, formatNumber(args[0]))
	} else if len(args) == 2 {
		return fmt.Sprintf("%s %s %s", formatNumber(args[0]), symbol, formatNumber(args[1]))
	}
	return ""
}

func writeJSON(w http.ResponseWriter, status int, resp CalculateResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(resp)
}

func MakeHandler(symbol string, expectedArgs int, op any) http.HandlerFunc {
	var unaryFn func(float64) (float64, error)
	var binaryFn func(float64, float64) (float64, error)

	switch expectedArgs {
	case 1:
		fn, ok := op.(func(float64) (float64, error))
		if !ok {
			panic(fmt.Sprintf("MakeHandler: op for symbol %q must be func(float64) (float64, error)", symbol))
		}
		unaryFn = fn
	case 2:
		fn, ok := op.(func(float64, float64) (float64, error))
		if !ok {
			panic(fmt.Sprintf("MakeHandler: op for symbol %q must be func(float64, float64) (float64, error)", symbol))
		}
		binaryFn = fn
	default:
		panic(fmt.Sprintf("MakeHandler: expectedArgs must be 1 or 2, got %d", expectedArgs))
	}

	return func(w http.ResponseWriter, r *http.Request) {
		ct := r.Header.Get("Content-Type")
		mediatype, _, err := mime.ParseMediaType(ct)
		if err != nil || mediatype != "application/json" {
			writeJSON(w, http.StatusUnsupportedMediaType, CalculateResponse{
				Error: "Content-Type must be application/json",
			})
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 1024)

		dec := json.NewDecoder(r.Body)
		dec.UseNumber()

		var raw struct {
			Arguments []any `json:"arguments"`
		}

		if err := dec.Decode(&raw); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				writeJSON(w, http.StatusRequestEntityTooLarge, CalculateResponse{
					Error: "request body too large",
				})
				return
			}
			writeJSON(w, http.StatusBadRequest, CalculateResponse{
				Error: "malformed JSON",
			})
			return
		}

		if _, err := io.Copy(io.Discard, r.Body); err != nil {
			var maxBytesErr *http.MaxBytesError
			if errors.As(err, &maxBytesErr) {
				writeJSON(w, http.StatusRequestEntityTooLarge, CalculateResponse{
					Error: "request body too large",
				})
				return
			}
		}

		if len(raw.Arguments) != expectedArgs {
			writeJSON(w, http.StatusBadRequest, CalculateResponse{
				Error: fmt.Sprintf("expected %d arguments, got %d", expectedArgs, len(raw.Arguments)),
			})
			return
		}

		args := make([]float64, len(raw.Arguments))
		for i, arg := range raw.Arguments {
			switch v := arg.(type) {
			case json.Number:
				f, err := strconv.ParseFloat(v.String(), 64)
				if err != nil {
					if errors.Is(err, strconv.ErrRange) || math.IsInf(f, 0) || math.IsNaN(f) {
						writeJSON(w, http.StatusBadRequest, CalculateResponse{
							Error: "invalid argument: NaN and Infinity are not allowed",
						})
						return
					}
					writeJSON(w, http.StatusBadRequest, CalculateResponse{
						Error: "malformed JSON",
					})
					return
				}
				if math.IsNaN(f) || math.IsInf(f, 0) {
					writeJSON(w, http.StatusBadRequest, CalculateResponse{
						Error: "invalid argument: NaN and Infinity are not allowed",
					})
					return
				}
				args[i] = f
			case float64:
				if math.IsNaN(v) || math.IsInf(v, 0) {
					writeJSON(w, http.StatusBadRequest, CalculateResponse{
						Error: "invalid argument: NaN and Infinity are not allowed",
					})
					return
				}
				args[i] = v
			case string:
				upper := strings.ToUpper(strings.TrimSpace(v))
				if upper == "NAN" || upper == "INF" || upper == "+INF" || upper == "-INF" || upper == "INFINITY" || upper == "+INFINITY" || upper == "-INFINITY" {
					writeJSON(w, http.StatusBadRequest, CalculateResponse{
						Error: "invalid argument: NaN and Infinity are not allowed",
					})
					return
				}
				writeJSON(w, http.StatusBadRequest, CalculateResponse{
					Error: "malformed JSON",
				})
				return
			default:
				writeJSON(w, http.StatusBadRequest, CalculateResponse{
					Error: "malformed JSON",
				})
				return
			}
		}

		expr := buildExpression(symbol, args)

		var result float64
		var mathErr error

		if expectedArgs == 1 {
			result, mathErr = unaryFn(args[0])
		} else {
			result, mathErr = binaryFn(args[0], args[1])
		}

		if mathErr != nil {
			writeJSON(w, http.StatusUnprocessableEntity, CalculateResponse{
				Error:      mathErr.Error(),
				Expression: expr,
			})
			return
		}

		if math.IsNaN(result) || math.IsInf(result, 0) {
			writeJSON(w, http.StatusUnprocessableEntity, CalculateResponse{
				Error:      "result overflow",
				Expression: expr,
			})
			return
		}

		writeJSON(w, http.StatusOK, CalculateResponse{
			Result:     &result,
			Expression: expr,
		})
	}
}
