package operations

import (
	"errors"
	"math"
	"testing"
)

const floatTolerance = 1e-9

func almostEqual(a, b float64) bool {
	if math.IsInf(a, 0) && math.IsInf(b, 0) {
		return (a > 0 && b > 0) || (a < 0 && b < 0)
	}
	if math.IsNaN(a) && math.IsNaN(b) {
		return true
	}
	diff := math.Abs(a - b)
	if diff <= floatTolerance {
		return true
	}
	largest := math.Max(math.Abs(a), math.Abs(b))
	if largest > 0 {
		return diff/largest <= floatTolerance
	}
	return false
}

func TestAdd(t *testing.T) {
	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive integers", 1, 2, 3},
		{"positive decimals", 1.5, 2.5, 4.0},
		{"negative and positive", -5, 3, -2},
		{"both negative", -10, -20, -30},
		{"zero addition", 0, 5, 5},
		{"large numbers", 1e100, 2e100, 3e100},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Add(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.expected) {
				t.Errorf("Add(%v, %v) = %v, expected %v", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}

func TestSubtract(t *testing.T) {
	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive integers", 5, 3, 2},
		{"negative result", 3, 5, -2},
		{"subtract negative", 5, -3, 8},
		{"both negative", -5, -3, -2},
		{"zero subtraction", 5, 0, 5},
		{"subtract from zero", 0, 5, -5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Subtract(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.expected) {
				t.Errorf("Subtract(%v, %v) = %v, expected %v", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}

func TestMultiply(t *testing.T) {
	tests := []struct {
		name     string
		a, b     float64
		expected float64
	}{
		{"positive integers", 4, 5, 20},
		{"positive decimals", 2.5, 4, 10},
		{"multiply by zero", 5, 0, 0},
		{"multiply by negative", 5, -3, -15},
		{"both negative", -4, -5, 20},
		{"large numbers", 1e150, 1e150, 1e300},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Multiply(tt.a, tt.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.expected) {
				t.Errorf("Multiply(%v, %v) = %v, expected %v", tt.a, tt.b, got, tt.expected)
			}
		})
	}
}

func TestDivide(t *testing.T) {
	tests := []struct {
		name        string
		a, b        float64
		expected    float64
		expectError bool
		expectedErr error
	}{
		{"exact division", 10, 2, 5, false, nil},
		{"fractional result", 1, 3, 1.0 / 3.0, false, nil},
		{"negative dividend", -10, 2, -5, false, nil},
		{"negative divisor", 10, -2, -5, false, nil},
		{"both negative", -10, -2, 5, false, nil},
		{"zero divided by number", 0, 5, 0, false, nil},
		{"division by zero", 10, 0, 0, true, ErrDivisionByZero},
		{"division by negative zero", 10, -0.0, 0, true, ErrDivisionByZero},
		{"zero divided by zero", 0, 0, 0, true, ErrDivisionByZero},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Divide(tt.a, tt.b)
			if tt.expectError {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				if !errors.Is(err, tt.expectedErr) && err.Error() != tt.expectedErr.Error() {
					t.Errorf("expected error %v, got %v", tt.expectedErr, err)
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if !almostEqual(got, tt.expected) {
					t.Errorf("Divide(%v, %v) = %v, expected %v", tt.a, tt.b, got, tt.expected)
				}
			}
		})
	}
}

func TestPower(t *testing.T) {
	tests := []struct {
		name     string
		base     float64
		exp      float64
		expected float64
	}{
		{"positive base and exp", 2, 3, 8},
		{"power of zero", 5, 0, 1},
		{"zero base positive exp", 0, 5, 0},
		{"negative exponent", 2, -1, 0.5},
		{"fractional exponent", 4, 0.5, 2},
		{"base 10", 10, 3, 1000},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Power(tt.base, tt.exp)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.expected) {
				t.Errorf("Power(%v, %v) = %v, expected %v", tt.base, tt.exp, got, tt.expected)
			}
		})
	}
}

func TestSqrt(t *testing.T) {
	tests := []struct {
		name        string
		val         float64
		expected    float64
		expectError bool
		expectedErr error
	}{
		{"perfect square", 25, 5, false, nil},
		{"square root of 0", 0, 0, false, nil},
		{"square root of 2", 2, math.Sqrt(2), false, nil},
		{"decimal square root", 0.25, 0.5, false, nil},
		{"negative number", -4, 0, true, ErrNegativeSqrt},
		{"negative small number", -0.0001, 0, true, ErrNegativeSqrt},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Sqrt(tt.val)
			if tt.expectError {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				if !errors.Is(err, tt.expectedErr) && err.Error() != tt.expectedErr.Error() {
					t.Errorf("expected error %v, got %v", tt.expectedErr, err)
				}
			} else {
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if !almostEqual(got, tt.expected) {
					t.Errorf("Sqrt(%v) = %v, expected %v", tt.val, got, tt.expected)
				}
			}
		})
	}
}

func TestPercentage(t *testing.T) {
	tests := []struct {
		name     string
		val      float64
		expected float64
	}{
		{"15 percent", 15, 0.15},
		{"100 percent", 100, 1.0},
		{"0 percent", 0, 0.0},
		{"negative percent", -50, -0.5},
		{"decimal percent", 0.5, 0.005},
		{"large percent", 250, 2.5},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Percentage(tt.val)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !almostEqual(got, tt.expected) {
				t.Errorf("Percentage(%v) = %v, expected %v", tt.val, got, tt.expected)
			}
		})
	}
}
