import { useReducer, useCallback, useRef, useEffect } from 'react';
import { CalculatorState, Operator } from '../types';
import { calculate as apiCalculate } from '../api/calculator';

function formatExpression(expr: string): string {
  return expr.replace(/\*/g, '×').replace(/\//g, '÷');
}

const UNARY_OPERATORS: Operator[] = ['√', '%'];

interface State {
  state: CalculatorState;
  upperDisplay: string;
  lowerDisplay: string;
  firstOperand: number | null;
  operator: Operator | null;
  error: string | null;
}

const initialState: State = {
  state: 'IDLE',
  upperDisplay: '',
  lowerDisplay: '0',
  firstOperand: null,
  operator: null,
  error: null,
};

type Action =
  | { type: 'CLEAR_ALL' }
  | { type: 'INPUT_DIGIT'; payload: string }
  | { type: 'INPUT_DECIMAL' }
  | { type: 'DELETE_LAST' }
  | { type: 'SET_BINARY_OPERATOR'; payload: Operator }
  | { type: 'CALC_SUCCESS'; payload: { result: number; expression: string } }
  | { type: 'CHAIN_SUCCESS'; payload: { result: number; nextOperator: Operator } }
  | { type: 'UNARY_FIRST_OR_RESULT_SUCCESS'; payload: { result: number; expression: string } }
  | { type: 'UNARY_WAIT_SECOND_SUCCESS'; payload: { result: number } }
  | { type: 'UNARY_SECOND_OPERAND_SUCCESS'; payload: { result: number } }
  | { type: 'SET_ERROR'; payload: string };

function calculatorReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CLEAR_ALL':
      return { ...initialState };

    case 'INPUT_DIGIT': {
      const digit = action.payload;

      if (state.state === 'ERROR') {
        return state;
      }

      if (state.state === 'IDLE') {
        return {
          ...state,
          state: 'FIRST_OPERAND',
          lowerDisplay: digit,
          upperDisplay: '',
        };
      }

      if (state.state === 'FIRST_OPERAND') {
        if (state.lowerDisplay === '0' && digit !== '0') {
          return { ...state, lowerDisplay: digit };
        }
        if (state.lowerDisplay === '0' && digit === '0') {
          return state;
        }
        return { ...state, lowerDisplay: state.lowerDisplay + digit };
      }

      if (state.state === 'WAIT_SECOND') {
        return {
          ...state,
          state: 'SECOND_OPERAND',
          lowerDisplay: digit,
        };
      }

      if (state.state === 'SECOND_OPERAND') {
        if (state.lowerDisplay === '0' && digit !== '0') {
          return { ...state, lowerDisplay: digit };
        }
        if (state.lowerDisplay === '0' && digit === '0') {
          return state;
        }
        return { ...state, lowerDisplay: state.lowerDisplay + digit };
      }

      if (state.state === 'RESULT') {
        return {
          ...initialState,
          state: 'FIRST_OPERAND',
          lowerDisplay: digit,
        };
      }

      return state;
    }

    case 'INPUT_DECIMAL': {
      if (state.state === 'ERROR') {
        return state;
      }

      if (state.state === 'IDLE') {
        return {
          ...state,
          state: 'FIRST_OPERAND',
          lowerDisplay: '0.',
          upperDisplay: '',
        };
      }

      if (state.state === 'FIRST_OPERAND') {
        if (!state.lowerDisplay.includes('.')) {
          return { ...state, lowerDisplay: state.lowerDisplay + '.' };
        }
        return state;
      }

      if (state.state === 'WAIT_SECOND') {
        return {
          ...state,
          state: 'SECOND_OPERAND',
          lowerDisplay: '0.',
        };
      }

      if (state.state === 'SECOND_OPERAND') {
        if (!state.lowerDisplay.includes('.')) {
          return { ...state, lowerDisplay: state.lowerDisplay + '.' };
        }
        return state;
      }

      if (state.state === 'RESULT') {
        return {
          ...initialState,
          state: 'FIRST_OPERAND',
          lowerDisplay: '0.',
        };
      }

      return state;
    }

    case 'DELETE_LAST': {
      if (state.state === 'FIRST_OPERAND') {
        if (state.lowerDisplay.length <= 1) {
          return { ...state, state: 'IDLE', lowerDisplay: '0' };
        }
        const next = state.lowerDisplay.slice(0, -1);
        if (next === '' || next === '-') {
          return { ...state, state: 'IDLE', lowerDisplay: '0' };
        }
        return { ...state, lowerDisplay: next };
      }

      if (state.state === 'SECOND_OPERAND') {
        if (state.lowerDisplay.length <= 1) {
          return { ...state, lowerDisplay: '0' };
        }
        const next = state.lowerDisplay.slice(0, -1);
        if (next === '' || next === '-') {
          return { ...state, lowerDisplay: '0' };
        }
        return { ...state, lowerDisplay: next };
      }

      return state;
    }

    case 'SET_BINARY_OPERATOR': {
      const op = action.payload;

      if (state.state === 'ERROR') {
        return state;
      }

      if (state.state === 'IDLE' || state.state === 'FIRST_OPERAND') {
        const val = parseFloat(state.lowerDisplay);
        return {
          ...state,
          state: 'WAIT_SECOND',
          firstOperand: val,
          operator: op,
          upperDisplay: `${state.lowerDisplay} ${op}`,
        };
      }

      if (state.state === 'WAIT_SECOND') {
        return {
          ...state,
          operator: op,
          upperDisplay: `${state.firstOperand} ${op}`,
        };
      }

      if (state.state === 'RESULT') {
        const val = parseFloat(state.lowerDisplay);
        return {
          ...state,
          state: 'WAIT_SECOND',
          firstOperand: val,
          operator: op,
          upperDisplay: `${state.lowerDisplay} ${op}`,
        };
      }

      return state;
    }

    case 'CALC_SUCCESS': {
      const formatted = formatExpression(action.payload.expression);
      return {
        ...state,
        state: 'RESULT',
        firstOperand: action.payload.result,
        operator: null,
        upperDisplay: `${formatted} = ${action.payload.result}`,
        lowerDisplay: String(action.payload.result),
        error: null,
      };
    }

    case 'CHAIN_SUCCESS': {
      return {
        ...state,
        state: 'WAIT_SECOND',
        firstOperand: action.payload.result,
        operator: action.payload.nextOperator,
        upperDisplay: `${action.payload.result} ${action.payload.nextOperator}`,
        lowerDisplay: String(action.payload.result),
        error: null,
      };
    }

    case 'UNARY_FIRST_OR_RESULT_SUCCESS': {
      const formatted = formatExpression(action.payload.expression);
      return {
        ...state,
        state: 'RESULT',
        firstOperand: action.payload.result,
        operator: null,
        upperDisplay: `${formatted} = ${action.payload.result}`,
        lowerDisplay: String(action.payload.result),
        error: null,
      };
    }

    case 'UNARY_WAIT_SECOND_SUCCESS': {
      return {
        ...state,
        firstOperand: action.payload.result,
        upperDisplay: `${action.payload.result} ${state.operator}`,
        lowerDisplay: String(action.payload.result),
        error: null,
      };
    }

    case 'UNARY_SECOND_OPERAND_SUCCESS': {
      return {
        ...state,
        lowerDisplay: String(action.payload.result),
        error: null,
      };
    }

    case 'SET_ERROR': {
      return {
        ...state,
        state: 'ERROR',
        error: action.payload,
        lowerDisplay: 'Error',
      };
    }

    default:
      return state;
  }
}

export interface UseCalculatorReturn {
  state: CalculatorState;
  upperDisplay: string;
  lowerDisplay: string;
  error: string | null;
  isError: boolean;
  inputDigit: (digit: string) => void;
  inputDecimal: () => void;
  setOperator: (op: Operator) => Promise<void> | void;
  calculate: () => Promise<void>;
  clearAll: () => void;
  deleteLast: () => void;
}

export function useCalculator(): UseCalculatorReturn {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const inputDigit = useCallback((digit: string) => {
    dispatch({ type: 'INPUT_DIGIT', payload: digit });
  }, []);

  const inputDecimal = useCallback(() => {
    dispatch({ type: 'INPUT_DECIMAL' });
  }, []);

  const deleteLast = useCallback(() => {
    dispatch({ type: 'DELETE_LAST' });
  }, []);

  const setOperator = useCallback(async (op: Operator) => {
    const current = stateRef.current;
    if (current.state === 'ERROR') {
      return;
    }

    const isUnary = UNARY_OPERATORS.includes(op);

    if (isUnary) {
      if (
        current.state === 'IDLE' ||
        current.state === 'FIRST_OPERAND' ||
        current.state === 'RESULT'
      ) {
        const val = parseFloat(current.lowerDisplay);
        try {
          const data = await apiCalculate(op, [val]);
          dispatch({
            type: 'UNARY_FIRST_OR_RESULT_SUCCESS',
            payload: { result: data.result, expression: data.expression },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Computation failed';
          dispatch({ type: 'SET_ERROR', payload: msg });
        }
        return;
      }

      if (current.state === 'WAIT_SECOND') {
        const val =
          current.firstOperand !== null
            ? current.firstOperand
            : parseFloat(current.lowerDisplay);
        try {
          const data = await apiCalculate(op, [val]);
          dispatch({
            type: 'UNARY_WAIT_SECOND_SUCCESS',
            payload: { result: data.result },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Computation failed';
          dispatch({ type: 'SET_ERROR', payload: msg });
        }
        return;
      }

      if (current.state === 'SECOND_OPERAND') {
        const val = parseFloat(current.lowerDisplay);
        try {
          const data = await apiCalculate(op, [val]);
          dispatch({
            type: 'UNARY_SECOND_OPERAND_SUCCESS',
            payload: { result: data.result },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Computation failed';
          dispatch({ type: 'SET_ERROR', payload: msg });
        }
        return;
      }
      return;
    }

    if (
      current.state === 'IDLE' ||
      current.state === 'FIRST_OPERAND' ||
      current.state === 'WAIT_SECOND' ||
      current.state === 'RESULT'
    ) {
      dispatch({ type: 'SET_BINARY_OPERATOR', payload: op });
      return;
    }

    if (current.state === 'SECOND_OPERAND') {
      if (current.firstOperand !== null && current.operator !== null) {
        const secondVal = parseFloat(current.lowerDisplay);
        try {
          const data = await apiCalculate(current.operator, [
            current.firstOperand,
            secondVal,
          ]);
          dispatch({
            type: 'CHAIN_SUCCESS',
            payload: { result: data.result, nextOperator: op },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Computation failed';
          dispatch({ type: 'SET_ERROR', payload: msg });
        }
      }
    }
  }, []);

  const calculate = useCallback(async () => {
    const current = stateRef.current;
    if (
      current.state !== 'SECOND_OPERAND' ||
      current.firstOperand === null ||
      current.operator === null
    ) {
      return;
    }

    const secondVal = parseFloat(current.lowerDisplay);
    try {
      const data = await apiCalculate(current.operator, [
        current.firstOperand,
        secondVal,
      ]);
      dispatch({
        type: 'CALC_SUCCESS',
        payload: { result: data.result, expression: data.expression },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Computation failed';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  return {
    state: state.state,
    upperDisplay: state.upperDisplay,
    lowerDisplay: state.lowerDisplay,
    error: state.error,
    isError: state.state === 'ERROR',
    inputDigit,
    inputDecimal,
    setOperator,
    calculate,
    clearAll,
    deleteLast,
  };
}
