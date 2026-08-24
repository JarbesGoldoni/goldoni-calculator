I need to build this full-stack calculator application according to the provided engineering challenge requirements. This repository is structured as a **monorepo** containing two decoupled applications: a Go backend service (`backend/`) and a React frontend application (`frontend/`), coordinated at the root via Docker Compose and a Makefile.

We will proceed step-by-step. After each step, report back and ask for confirmation before proceeding to the next.

---

## Phase 1: Go Backend Service

1. Build the Go backend service in `backend/` with **one REST endpoint per calculator operation**, all accepting a uniform JSON payload `{ "arguments": [number, ...] }`:

   ```
   POST /api/add           { "arguments": [a, b] }       → a + b
   POST /api/subtract      { "arguments": [a, b] }       → a - b
   POST /api/multiply      { "arguments": [a, b] }       → a × b
   POST /api/divide        { "arguments": [a, b] }       → a ÷ b  (b ≠ 0)
   POST /api/power         { "arguments": [base, exp] }   → base^exp
   POST /api/sqrt          { "arguments": [value] }       → √value (value ≥ 0, unary)
   POST /api/percentage    { "arguments": [value] }       → value / 100 (unary postfix)
   GET  /health                                           → { "status": "ok" }
   ```

   There is **no generic `/api/calculate` fallback endpoint**. Every operation has a dedicated route. Unknown operations simply return 404.

   ### HTTP Status Codes

   The API uses the following status codes consistently:

   | Status | Meaning | When |
   |--------|---------|------|
   | 200 | Success | Computation completed successfully |
   | 400 | Bad Request | Malformed JSON, wrong argument count, `NaN`/`Infinity` in input arguments |
   | 404 | Not Found | Unknown route |
   | 413 | Payload Too Large | Request body exceeds size limit |
   | 415 | Unsupported Media Type | `Content-Type` is not `application/json` |
   | 422 | Unprocessable Entity | Valid input but computation failed (division by zero, negative square root, result overflow) |

   ### Response Envelope

   Every response follows a uniform JSON envelope. The `expression` field uses **machine-readable code symbols** (`+`, `-`, `*`, `/`, `^`, `sqrt`, `%`) — the frontend is responsible for translating these into display symbols (`×`, `÷`) as needed.

   - Success (200) binary operation:
     ```json
     { "result": 3, "expression": "1 + 2" }
     ```
   - Success (200) unary operations:
     ```json
     { "result": 5, "expression": "sqrt(25)" }
     ```
     ```json
     { "result": 0.15, "expression": "15%" }
     ```
   - Domain error (422) — the `expression` field is included because arguments were parsed successfully:
     ```json
     { "error": "division by zero", "expression": "10 / 0" }
     ```
     ```json
     { "error": "square root of negative number", "expression": "sqrt(-4)" }
     ```
   - Overflow error (422):
     ```json
     { "error": "result overflow", "expression": "1e+308 * 1e+308" }
     ```
   - Input validation error (400) — no `expression` because arguments are invalid or unparseable:
     ```json
     { "error": "expected 2 arguments, got 3" }
     ```
     ```json
     { "error": "invalid argument: NaN and Infinity are not allowed" }
     ```
   - Content-Type error (415):
     ```json
     { "error": "Content-Type must be application/json" }
     ```
   - Body size error (413):
     ```json
     { "error": "request body too large" }
     ```

   ### Architecture

   Implement the math logic as **pure functions** in an `operations/` package with no HTTP awareness. These functions have no access to `context.Context` — they are strictly pure computations:
   - `Add(a, b float64) (float64, error)`
   - `Subtract(a, b float64) (float64, error)`
   - `Multiply(a, b float64) (float64, error)`
   - `Divide(a, b float64) (float64, error)` (returns error if `b == 0`)
   - `Power(base, exp float64) (float64, error)`
   - `Sqrt(val float64) (float64, error)` (returns error if `val < 0`)
   - `Percentage(val float64) (float64, error)` (`val / 100.0`)

   Build a **handler factory** (`MakeHandler`) that accepts the operation's code symbol, expected argument count, and a math function, then returns an `http.HandlerFunc`. The factory performs these steps in order:

   1. Validate `Content-Type` is `application/json` (415 if not)
   2. Limit request body size with `http.MaxBytesReader` (1024 bytes max, return 413 if exceeded)
   3. Decode JSON into the request struct (400 if malformed)
   4. Validate argument count matches expected count (400 if mismatch)
   5. Validate no argument is `NaN` or `±Infinity` (`math.IsNaN`, `math.IsInf` → 400)
   6. Call the math function
   7. If the math function returns an error, respond with 422 and include the `expression`
   8. Validate the result is not `NaN` or `±Infinity` (safety net for overflow — 422 with `"result overflow"`)
   9. Respond with 200 and the result + expression

   The factory builds the `expression` string from the arguments and the symbol parameter:
   - Binary operations (argCount == 2): `"1 + 2"`, `"10 / 0"`, `"2 ^ 10"`
   - Unary operations (argCount == 1): `"sqrt(25)"` for symbol `"sqrt"`, `"15%"` for symbol `"%"`

   Each route handler is a trivial one-liner wiring a pure function to the factory:
   ```go
   mux.HandleFunc("POST /api/add", MakeHandler("+", 2, operations.Add))
   mux.HandleFunc("POST /api/subtract", MakeHandler("-", 2, operations.Subtract))
   mux.HandleFunc("POST /api/multiply", MakeHandler("*", 2, operations.Multiply))
   mux.HandleFunc("POST /api/divide", MakeHandler("/", 2, operations.Divide))
   mux.HandleFunc("POST /api/power", MakeHandler("^", 2, operations.Power))
   mux.HandleFunc("POST /api/sqrt", MakeHandler("sqrt", 1, operations.Sqrt))
   mux.HandleFunc("POST /api/percentage", MakeHandler("%", 1, operations.Percentage))
   ```

   Request and response types (`CalculateRequest`, `CalculateResponse`) are defined **inline in the `handler` package** — not in a separate `model/` package.

   ### Middleware

   Include **CORS middleware** allowing requests from `http://localhost:3000` and `http://localhost:5173`, and a **structured logging middleware** using Go's standard `slog` package that logs method, path, status code, and duration as structured key-value fields. Use `slog.Info` for successful requests and `slog.Error` for failures, using the request's `r.Context()` for context-aware logging.

   Provide a lightweight `/health` endpoint returning `{"status": "ok"}`.

   ### Backend Project Structure

   ```
   backend/
   ├── main.go
   ├── handler/
   │   ├── handler.go          # MakeHandler factory + Request/Response types
   │   ├── handler_test.go     # HTTP-layer tests
   │   ├── routes.go           # All route wiring
   │   └── health.go           # /health endpoint handler
   ├── operations/
   │   ├── operations.go       # Pure math functions
   │   └── operations_test.go  # Unit tests for math functions
   ├── middleware/
   │   ├── cors.go             # CORS handling
   │   └── logging.go          # Structured slog middleware
   ├── Dockerfile              # Go build + lightweight Alpine/distroless runner
   ├── go.mod
   └── go.sum
   ```

2. Write comprehensive backend tests in two separate suites:

   - **`operations/operations_test.go`**: Table-driven tests for pure math functions covering:
     - Normal cases (basic arithmetic, known results)
     - Edge cases (division by zero returns error, negative square root returns error)
     - Percentage calculations (e.g., 15 → 0.15, 0 → 0, -50 → -0.5)
     - Boundary values (very large numbers that cause overflow, zero arguments)

   - **`handler/handler_test.go`**: HTTP-layer tests using `httptest` covering:
     - Valid payloads → correct 200 response with result and expression
     - Missing/extra arguments → 400
     - Invalid JSON → 400
     - `NaN` or `Infinity` in arguments → 400 with specific error message
     - Wrong `Content-Type` header → 415
     - Oversized request body → 413
     - Division by zero → 422 with error and expression
     - Negative square root → 422 with error and expression
     - Overflow result (e.g., `math.Pow(1e308, 2)`) → 422 with "result overflow"
     - 404 for unknown routes

3. Run `go test -cover -coverprofile=coverage.out ./...` and verify coverage.

4. Create the backend `Dockerfile`, verify the container builds, and run tests inside the container.

---

## Phase 2: React Frontend

5. Build the frontend in `frontend/` using React with TypeScript, ensuring a clean, minimalist design reminiscent of a physical calculator while remaining fully responsive across mobile and desktop viewports. The interface must be composable and structured cleanly:

   a. **Display component** with two sub-views: an upper view aligned to the left displaying the previous calculation or active operation in smaller text (e.g., "1 + 2 = 3" or "8 ×"), and a lower view aligned to the right displaying the active input or current result in larger text (e.g., "32"). Use proper mathematical symbols ("×" and "÷") rather than code-style symbols ("*" and "/") in all display output.

   b. **Unified Button component** that accepts variant types (numeric, operator, decimal, and control) and renders the appropriate value and styling. This includes dedicated clear and reset controls (All Clear "AC" and Clear/Backspace) to manage calculator state.

   c. **API client with explicit endpoint mapping**: Define an `ENDPOINT_MAP` that maps each operator's display symbol to its dedicated backend route. If an operator is not in the map, the request never leaves the browser — throw a client-side error immediately. There is no generic fallback endpoint.

      ```ts
      const ENDPOINT_MAP: Record<string, string> = {
        '+': '/api/add',
        '-': '/api/subtract',
        '×': '/api/multiply',
        '÷': '/api/divide',
        '^': '/api/power',
        '√': '/api/sqrt',
        '%': '/api/percentage',
      };
      ```

   d. **State management — resolve-on-operator model**: All calculations must be delegated to the backend, regardless of how simple they are. There is **no chained multi-term evaluation**. Every backend call is always a single binary operation (two arguments) or a single unary operation (one argument for `√` and `%`). The calculator resolves left-to-right, one operation at a time, exactly like a standard physical calculator.

      ### Decimal & Input Rules
      - **Leading Decimal**: If the user inputs `.` with an empty display or as the first character of an operand, treat it as `0.` (e.g., `.` followed by `4` yields `0.4`).
      - **Single Decimal Point**: If the current operand already contains a `.`, subsequent `.` inputs are ignored (e.g., typing `1.1.1` results in `1.1`).
      - **Backspace Scope**: Backspace only operates during active digit entry (`FIRST_OPERAND` or `SECOND_OPERAND`). If all characters of an operand are deleted, the display falls back to `"0"`. In non-entry states (`WAIT_SECOND`, `RESULT`, `ERROR`), backspace is a no-op.

      ### State Machine Transitions

      | Current State | Trigger | Next State | Action |
      |---------------|---------|------------|--------|
      | `IDLE` | digit (`0`–`9`) | `FIRST_OPERAND` | Set lower display to digit |
      | `IDLE` | `.` (decimal) | `FIRST_OPERAND` | Set lower display to `"0."` |
      | `FIRST_OPERAND` | digit (`0`–`9`) | `FIRST_OPERAND` | Append digit to lower display |
      | `FIRST_OPERAND` | `.` (decimal) | `FIRST_OPERAND` | Append `.` if not already present, otherwise ignore |
      | `FIRST_OPERAND` | Backspace | `FIRST_OPERAND` / `IDLE` | Remove last character; if empty, show `"0"` and transition to `IDLE` |
      | `FIRST_OPERAND` | binary operator (`+`, `-`, `×`, `÷`, `^`) | `WAIT_SECOND` | Store first operand + operator; upper display shows `"N op"`, lower shows `"N"` |
      | `FIRST_OPERAND` | unary operator (`√`, `%`) | `RESULT` | **Call backend** with `[first_operand]`; lower display shows result, upper shows expression (e.g., `"sqrt(25) = 5"`) |
      | `FIRST_OPERAND` | `=` | `FIRST_OPERAND` | No-op (ignore) |
      | `WAIT_SECOND` | digit (`0`–`9`) | `SECOND_OPERAND` | Set lower display to digit |
      | `WAIT_SECOND` | `.` (decimal) | `SECOND_OPERAND` | Set lower display to `"0."` |
      | `WAIT_SECOND` | binary operator | `WAIT_SECOND` | Replace stored operator; upper display updates to `"N new_op"` |
      | `WAIT_SECOND` | unary operator (`√`, `%`) | `WAIT_SECOND` | **Call backend** on first operand with unary op; result becomes new first operand; upper display shows `"new_result op"` |
      | `WAIT_SECOND` | Backspace | `WAIT_SECOND` | No-op |
      | `WAIT_SECOND` | `=` | `WAIT_SECOND` | No-op (ignore) |
      | `SECOND_OPERAND` | digit (`0`–`9`) | `SECOND_OPERAND` | Append digit to lower display |
      | `SECOND_OPERAND` | `.` (decimal) | `SECOND_OPERAND` | Append `.` if not already present, otherwise ignore |
      | `SECOND_OPERAND` | Backspace | `SECOND_OPERAND` | Remove last character; if empty, show `"0"` |
      | `SECOND_OPERAND` | `=` | `RESULT` | **Call backend** with `[first, second]` for current operator; show result and full expression in upper display |
      | `SECOND_OPERAND` | binary operator | `WAIT_SECOND` | **Call backend** to resolve current expression; result becomes new first operand, store new operator; upper display shows `"result new_op"` |
      | `SECOND_OPERAND` | unary operator (`√`, `%`) | `SECOND_OPERAND` | **Call backend** on second operand with unary op; result replaces second operand in lower display |
      | `RESULT` | digit (`0`–`9`) | `FIRST_OPERAND` | Start fresh calculation; set lower display to digit, clear upper display |
      | `RESULT` | `.` (decimal) | `FIRST_OPERAND` | Start fresh calculation; set lower display to `"0."`, clear upper display |
      | `RESULT` | binary operator | `WAIT_SECOND` | Use result as first operand, store operator; upper display shows `"result op"` |
      | `RESULT` | unary operator (`√`, `%`) | `RESULT` | **Call backend** on result with unary op; display new result and expression |
      | `RESULT` | Backspace | `RESULT` | No-op |
      | `RESULT` | `=` | `RESULT` | No-op |
      | any | `AC` | `IDLE` | Reset all state, display `"0"` |
      | any | backend error | `ERROR` | Show error message, disable all buttons except `AC` |
      | `ERROR` | `AC` | `IDLE` | Reset all state, display `"0"` |

      ### Example Flows

      - **Operator chaining**:
        ```
        User: 5 + 3 ×
          → Backend call: POST /api/add {"arguments": [5, 3]} → 8
          → Upper display: "5 + 3 = 8" (or "8 ×")
          → Lower display: "8"
        User: 4 =
          → Backend call: POST /api/multiply {"arguments": [8, 4]} → 32
          → Upper display: "8 × 4 = 32"
          → Lower display: "32"
        ```

      - **Operator replacement**:
        ```
        User: 5 +
          → Stored: first=5, op='+'
        User: ×
          → Operator replaced: first=5, op='×'
          → Upper display: "5 ×"
        User: 4 =
          → Backend call: POST /api/multiply {"arguments": [5, 4]} → 20
        ```

      - **Unary operations (`√` and `%`)**:
        ```
        User: 25 √
          → Backend call: POST /api/sqrt {"arguments": [25]} → 5
          → Lower display: "5"
        User: 15 %
          → Backend call: POST /api/percentage {"arguments": [15]} → 0.15
          → Lower display: "0.15"
        ```

   e. **Error handling and visual feedback**: Robustly handle backend error responses (such as division by zero, overflow, or network failure). If an error occurs, transition the display into an explicit "Error" state showing the backend's error message, disable all operations except `AC`, and allow the user to reset using the clear control.

   f. **Physical keyboard support**: Implement a `useKeyboard` hook with a global keyboard listener that maps keys to calculator actions:
      - Numeric keys (`0`–`9`) → digit input
      - Decimal key (`.`) → decimal input
      - `+`, `-` → operators directly
      - `*` → maps to `×`, `/` → maps to `÷`
      - `^`, `%` → operators directly
      - `Enter` or `=` → evaluate
      - `Escape` or `c` / `C` → AC (all clear)
      - `Backspace` → delete last digit

      Unmapped keys are silently ignored — no warning notifications, no toast messages. There is no keyboard hint component.

   ### Frontend Project Structure

   ```
   frontend/
   ├── src/
   │   ├── App.tsx
   │   ├── components/
   │   │   ├── Calculator.tsx
   │   │   ├── Display/
   │   │   │   ├── Display.tsx
   │   │   │   └── Display.test.tsx
   │   │   └── Button/
   │   │       ├── Button.tsx
   │   │       └── Button.test.tsx
   │   ├── hooks/
   │   │   ├── useCalculator.ts
   │   │   ├── useCalculator.test.ts
   │   │   ├── useKeyboard.ts
   │   │   └── useKeyboard.test.ts
   │   ├── api/
   │   │   ├── calculator.ts
   │   │   └── calculator.test.ts
   │   └── types/
   │       └── index.ts
   ├── vite.config.ts               # Dev proxy: /api → http://localhost:8080
   ├── Dockerfile                    # Multi-stage: Node build + Nginx
   ├── nginx.conf                    # Prod reverse proxy for /api
   ├── package.json
   └── tsconfig.json
   ```

6. Configure **Vite dev proxy** in `vite.config.ts` to forward `/api` requests to `http://localhost:8080`, avoiding CORS issues during local development.

7. Write frontend tests using **Vitest** as the test runner with `jsdom` environment and **`@testing-library/react`** for component/hook testing (`render`, `renderHook`, `act`, `waitFor`, `screen`, `fireEvent`). Install `@testing-library/jest-dom` for DOM matchers. Cover the following:

   - **`Display.test.tsx`**: Renders upper/lower sub-views with correct text, alignment, and sizing. Renders error state. Displays mathematical symbols (×, ÷) correctly.

   - **`Button.test.tsx`**: Renders all variant types (numeric, operator, decimal, control) with correct labels and styles. Fires click callbacks.

   - **`calculator.test.ts`** (API client): Verifies `ENDPOINT_MAP` resolves known operators to correct routes. Verifies unknown operator throws client-side error without making a fetch call. Verifies success and error response parsing.

   - **`useKeyboard.test.ts`**: Simulates `keydown` events and verifies correct callback invocation for each mapped key. Verifies unmapped keys are silently ignored (no callback called).

   - **`useCalculator.test.ts`** — the most critical test file. Test the state machine using `renderHook` with a **mocked API client** (`vi.mock('../api/calculator')`). Each test case should call `act()` to trigger state transitions and `waitFor()` for async API resolution. **Mandatory test scenarios:**

     1. **Basic operation**: Press `5`, `+`, `3`, `=` → verify API called with operator `+` and arguments `[5, 3]` → verify display shows result `8`
     2. **Operator chaining**: Press `5`, `+`, `3`, `×` → verify API called for `+` with `[5, 3]` → verify state transitions to `8 ×` → press `4`, `=` → verify API called for `×` with `[8, 4]` → verify result `32`
     3. **Operator replacement**: Press `5`, `+`, `×`, `4`, `=` → verify API called for `×` with `[5, 4]` (not `+`) → verify result `20`
     4. **Unary operation (sqrt & percentage)**: Press `2`, `5`, `√` → verify API called for `√` with `[25]` → result `5`. Press `1`, `5`, `%` → verify API called for `%` with `[15]` → result `0.15`
     5. **Result then operator**: Press `5`, `+`, `3`, `=` → result `8` → press `×` → verify `8` carries as first operand → press `2`, `=` → verify API called for `×` with `[8, 2]` → result `16`
     6. **Result then digit (fresh start)**: Press `5`, `+`, `3`, `=` → result `8` → press `9` → verify fresh state with `9` as new input, previous expression cleared
     7. **Decimal input validation**: Press `.`, `5`, `+`, `1`, `.`, `2`, `.`, `3`, `=` → verify parsed arguments are `[0.5, 1.23]` (leading dot prepends 0, second dot ignored) → result `1.73`
     8. **Backspace behavior**: Type `1`, `2`, `3`, backspace → shows `12`; backspace twice → shows `0` in `IDLE` state
     9. **Error recovery**: Press `5`, `÷`, `0`, `=` → verify error state from backend → verify all buttons except AC are disabled → press AC → verify reset to idle
     10. **AC during expression**: Press `5`, `+` → press AC → verify complete reset to idle with display `0`

8. Configure a `"test:coverage"` script in `package.json` to output line and branch coverage metrics. Run tests and verify coverage.

9. Create the frontend `Dockerfile` (multi-stage: Node build → Nginx serve) and `nginx.conf` (serves static files + reverse proxies `/api/` to `http://backend:8080`). Verify the container builds.

---

## Phase 3: Orchestration

10. Create `docker-compose.yml` at the project root that networks both services together for single-command startup:
    a. Backend service on port 8080 with a health check against `/health`.
    b. Frontend service on port 3000 with `depends_on` condition requiring backend to be healthy (`condition: service_healthy`).
    c. The entire stack boots with `docker compose up --build`.

11. Create a **Makefile** at the project root with targets:
    ```
    dev-backend    — Run Go backend locally
    dev-frontend   — Run React frontend locally
    test-backend   — Run backend tests with coverage
    test-frontend  — Run frontend tests with coverage
    test           — Run all tests (backend + frontend)
    docker         — docker compose up --build
    ```

---

## Phase 4: Documentation & Polish

12. Generate comprehensive `README.md` covering:
    a. Monorepo overview and architecture breakdown.
    b. Step-by-step setup and execution instructions for both local development and single-command Docker Compose runs.
    c. Complete API documentation with example JSON request and response payloads for every supported operation and every error case (division by zero, negative sqrt, overflow, invalid input, wrong content-type, payload too large).
    d. Verified test coverage summary tables for both backend and frontend, showing actual coverage numbers.
    e. Key design decisions, trade-offs, and assumptions. **Must include**:
       - Why POST was chosen for pure computations (request bodies are standard for POST; GET with JSON bodies is non-standard and many proxies/caches strip them; all operations use a uniform payload structure).
       - Why the `expression` field uses code symbols instead of display symbols (separation of concerns — the backend returns machine-readable data, the frontend handles presentation).
       - Resolve-on-operator model (standard physical calculator behavior, no expression parsing needed, each API call is a single isolated operation).
       - Percentage design as a unary postfix operation (`value / 100`) rather than binary calculation.
    f. Reference to `PROMPTS.md` under an "AI Tooling & Prompts" section.

13. Ensure `PROMPTS.md` exists at the project root (creating or consolidating any existing prompt logs) and clearly documents the prompts and iterations used during development.

14. **Only if all core requirements above are solid and time permits**: Create `.github/workflows/ci.yml` with two jobs:
    - Backend: checkout → setup Go → run tests with coverage
    - Frontend: checkout → setup Node → npm ci → run tests with coverage

    Keep it minimal — no matrix builds, no caching, no artifact uploads.

15. Final review pass: verify `docker compose up --build` works end-to-end, all tests pass, README is accurate, and the repository is clean.

---

## Structured Lifecycle

### Service Workflow (applies to both Backend and Frontend)
1. Implementation of the service and its tests.
2. Execution of the build and test suite, including generation of the test coverage report.
3. Creation of the Dockerfile, verification of the container build, and execution of tests within the container environment.
4. Review and refinement loop:
   a. Conduct a thorough code, container setup, and test quality review using a dedicated reviewer agent. The review must focus on reliability, architectural integrity, container readiness, and test efficacy—ensuring tests genuinely validate required behavior rather than excessively mocking critical logic.
   b. Route the review findings back to the implementation agent to apply the necessary refinements.
   c. Re-run the build, container execution, and test suite to confirm stability.
   d. Repeat this loop if further improvements are required. Any identified issues must be addressed before proceeding to the next phase.

### Orchestration and Documentation Workflow
1. Creation of `docker-compose.yml` with backend health checks, proper port exposures, and service dependency ordering.
2. Creation of Makefile with all developer experience targets.
3. Verification of single-command full-stack startup (`docker compose up --build`) and end-to-end integration.
4. Generation of the comprehensive `README.md` document with coverage tables and design decisions.
5. Verification of `PROMPTS.md`.
6. If time permits: creation of GitHub Actions CI workflow.
7. Review and verification of documentation clarity and completeness.
