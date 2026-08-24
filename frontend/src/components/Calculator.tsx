import React from 'react';
import { useCalculator } from '../hooks/useCalculator';
import { useKeyboard } from '../hooks/useKeyboard';
import { Display } from './Display/Display';
import { Button } from './Button/Button';

export const Calculator: React.FC = () => {
  const {
    upperDisplay,
    lowerDisplay,
    isError,
    error,
    inputDigit,
    inputDecimal,
    setOperator,
    calculate,
    clearAll,
    deleteLast,
  } = useCalculator();

  useKeyboard({
    inputDigit,
    inputDecimal,
    setOperator,
    calculate,
    clearAll,
    deleteLast,
  });

  return (
    <div className="calculator-container" data-testid="calculator">
      <div className="calculator-brand-bar">
        <span className="calculator-brand-name">goldoni</span>
        <div className="calculator-solar-strip" aria-hidden="true">
          <div className="solar-cell" />
          <div className="solar-cell" />
          <div className="solar-cell" />
          <div className="solar-cell" />
        </div>
      </div>
      <Display
        upperDisplay={upperDisplay}
        lowerDisplay={lowerDisplay}
        isError={isError}
        error={error}
      />
      <div className="calculator-keypad">
        <Button label="AC" variant="control" onClick={clearAll} />
        <Button
          label="DEL"
          variant="control"
          onClick={deleteLast}
          disabled={isError}
          ariaLabel="Delete last digit"
        />
        <Button
          label="√"
          variant="operator"
          onClick={() => setOperator('√')}
          disabled={isError}
          ariaLabel="Square root"
        />
        <Button
          label="^"
          variant="operator"
          onClick={() => setOperator('^')}
          disabled={isError}
          ariaLabel="Power"
        />

        <Button
          label="7"
          variant="numeric"
          onClick={() => inputDigit('7')}
          disabled={isError}
        />
        <Button
          label="8"
          variant="numeric"
          onClick={() => inputDigit('8')}
          disabled={isError}
        />
        <Button
          label="9"
          variant="numeric"
          onClick={() => inputDigit('9')}
          disabled={isError}
        />
        <Button
          label="÷"
          variant="operator"
          onClick={() => setOperator('÷')}
          disabled={isError}
          ariaLabel="Divide"
        />

        <Button
          label="4"
          variant="numeric"
          onClick={() => inputDigit('4')}
          disabled={isError}
        />
        <Button
          label="5"
          variant="numeric"
          onClick={() => inputDigit('5')}
          disabled={isError}
        />
        <Button
          label="6"
          variant="numeric"
          onClick={() => inputDigit('6')}
          disabled={isError}
        />
        <Button
          label="×"
          variant="operator"
          onClick={() => setOperator('×')}
          disabled={isError}
          ariaLabel="Multiply"
        />

        <Button
          label="1"
          variant="numeric"
          onClick={() => inputDigit('1')}
          disabled={isError}
        />
        <Button
          label="2"
          variant="numeric"
          onClick={() => inputDigit('2')}
          disabled={isError}
        />
        <Button
          label="3"
          variant="numeric"
          onClick={() => inputDigit('3')}
          disabled={isError}
        />
        <Button
          label="-"
          variant="operator"
          onClick={() => setOperator('-')}
          disabled={isError}
          ariaLabel="Subtract"
        />

        <Button
          label="0"
          variant="numeric"
          onClick={() => inputDigit('0')}
          disabled={isError}
        />
        <Button
          label="."
          variant="decimal"
          onClick={inputDecimal}
          disabled={isError}
          ariaLabel="Decimal point"
        />
        <Button
          label="%"
          variant="operator"
          onClick={() => setOperator('%')}
          disabled={isError}
          ariaLabel="Percentage"
        />
        <Button
          label="+"
          variant="operator"
          onClick={() => setOperator('+')}
          disabled={isError}
          ariaLabel="Add"
        />

        <Button
          label="="
          variant="action"
          className="calc-btn-equals"
          onClick={calculate}
          disabled={isError}
          ariaLabel="Equals"
        />
      </div>
    </div>
  );
};
