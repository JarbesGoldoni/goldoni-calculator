I need to build this full-stack calculator application according to the provided engineering challenge requirements. We will proceed step-by-step. After each step, report back and ask for confirmation before proceeding to the next.

1. First, build the Go backend service. It should expose a single REST endpoint to handle all single operations (addition, subtraction, multiplication, division, exponentiation, square root, and percentage). The endpoint must accept a JSON payload containing the operation identifier and a list of arguments, structured as:
`{"operation": "+", "arguments": [1, 3]}`
Implement the evaluation engine using deterministic, scoped functions without global side effects. A central dispatcher function should receive the payload, route the operation via a switch statement, and invoke dedicated operation functions that process the arguments within their own local scope and return the result. Handle edge cases cleanly, such as division by zero or invalid input types.
2. Next, build the frontend using React with TypeScript, ensuring a clean, minimalist design reminiscent of a physical calculator while remaining fully responsive across mobile and desktop viewports. The interface must be composable and structured cleanly without cluttered top-level nesting:
a. A screen component with two sub-views: an upper view aligned to the left displaying the previous calculation in smaller text (e.g., "1 + 2"), and a lower view aligned to the right displaying the active input or chained calculation in larger text (e.g., "3 ×"). Use proper mathematical symbols ("×" and "÷") rather than code-style symbols ("*" and "/").
b. A unified button component that accepts variant types (numeric, operator, and decimal) and renders the appropriate value and styling.
c. State management and chaining logic: All calculations must be delegated to the backend, regardless of how simple they are. Hitting numbers merely updates the current input. If an expression is active (e.g., "1 + 2") and another operator is pressed (e.g., "×"), the frontend must trigger a backend call to resolve "1 + 2 = 3", transition the resolved expression to the upper display, and set the lower display to "3 ×" awaiting the next argument. The equals button should resolve the final expression.


Implement comprehensive unit tests for both the backend and frontend within their respective stages. For the backend, maintain separate test suites: one for the individual mathematical operations and another for the routing and dispatch logic to ensure proper payload handling and edge case validation. For the frontend, write isolated tests for the display components, button rendering across all variants, and state management logic to verify that user interactions transition state correctly and trigger API requests only when chaining operators on an active expression or pressing the equals button.

The structured lifecycle for each layer must follow these sequential phases:

Backend Workflow:

1. Backend implementation.
2. Backend unit and integration test creation.
3. Execution of the backend build and test suite.
4. Comprehensive code review by a dedicated reviewer agent. The review must focus on reliability, architectural integrity, and test efficacy—ensuring tests genuinely validate required behavior rather than excessively mocking critical logic. Any identified issues must be addressed before proceeding.

Frontend Workflow:

1. Frontend implementation alongside frontend component and state tests.
2. Execution of the frontend build and test suite.
3. Frontend review and refinement loop:
a. Conduct a thorough code and test quality review using a dedicated reviewer agent.
b. Route the review findings back to the implementation agent to apply the necessary refinements.
c. Re-run the frontend build and test suite to confirm stability.
d. Repeat this review loop if further improvements are required.
