export type CalculatorState =
  | 'IDLE'
  | 'FIRST_OPERAND'
  | 'WAIT_SECOND'
  | 'SECOND_OPERAND'
  | 'RESULT'
  | 'ERROR';

export type Operator = '+' | '-' | '×' | '÷' | '^' | '√' | '%';

export type ButtonVariant = 'numeric' | 'operator' | 'decimal' | 'control' | 'action';

export interface CalculateRequest {
  arguments: number[];
}

export interface CalculateResponse {
  result: number;
  expression: string;
}

export interface ApiErrorResponse {
  error: string;
  expression?: string;
}
