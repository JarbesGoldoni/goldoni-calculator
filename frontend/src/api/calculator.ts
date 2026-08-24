import { CalculateRequest, CalculateResponse, ApiErrorResponse } from '../types';

export const ENDPOINT_MAP: Record<string, string> = {
  '+': '/api/add',
  '-': '/api/subtract',
  '×': '/api/multiply',
  '÷': '/api/divide',
  '^': '/api/power',
  '√': '/api/sqrt',
  '%': '/api/percentage',
};

export async function calculate(operator: string, args: number[]): Promise<CalculateResponse> {
  const endpoint = ENDPOINT_MAP[operator];
  if (!endpoint) {
    throw new Error(`Unsupported operator: ${operator}`);
  }

  const payload: CalculateRequest = { arguments: args };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = 'Computation failed';
    try {
      const errorData: ApiErrorResponse = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = response.statusText || 'Computation failed';
    }
    throw new Error(errorMessage);
  }

  const data: CalculateResponse = await response.json();
  return {
    result: data.result,
    expression: data.expression,
  };
}
