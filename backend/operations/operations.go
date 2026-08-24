package operations

import (
	"errors"
	"math"
)

var (
	ErrDivisionByZero = errors.New("division by zero")
	ErrNegativeSqrt   = errors.New("square root of negative number")
)

func Add(a, b float64) (float64, error) {
	return a + b, nil
}

func Subtract(a, b float64) (float64, error) {
	return a - b, nil
}

func Multiply(a, b float64) (float64, error) {
	return a * b, nil
}

func Divide(a, b float64) (float64, error) {
	if b == 0 {
		return 0, ErrDivisionByZero
	}
	return a / b, nil
}

func Power(base, exp float64) (float64, error) {
	return math.Pow(base, exp), nil
}

func Sqrt(val float64) (float64, error) {
	if val < 0 {
		return 0, ErrNegativeSqrt
	}
	return math.Sqrt(val), nil
}

func Percentage(val float64) (float64, error) {
	return val / 100.0, nil
}
