# Feature Proposal: Enforce Hot News Filter (Hardcoded)

## 1. Context & Objectives
The user has reported receiving non-hot news in the dedicated Telegram topic. To eliminate any ambiguity or logic errors, we will **hardcode** the `is_hot=Y` parameter into the Mlion API base URL.
This ensures that every single request made by the `MlionFetcher` explicitly requests filtered hot news, regardless of dynamic logic states.

## 2. Technical Changes

### 2.1 Codebase
-   **File**: `service/news/mlion.go`
-   **Change**: Update `mlionBaseURL` constant.
    -   From: `https://api.mlion.ai/v2/api/news/real/time`
    -   To: `https://api.mlion.ai/v2/api/news/real/time?is_hot=Y`
-   **Cleanup**: Remove the dynamic query parameter appending logic in `FetchNews`.

### 2.2 Verification
-   **Unit Tests**: Update `service/news/mlion_test.go` to account for the parameter being part of the base URL (or ensure the mock handles it).
-   **Impact**: Guarantees server-side filtering at the source.

## 3. Implementation Plan
1.  Modify `service/news/mlion.go`: Hardcode the parameter.
2.  Modify `service/news/mlion_test.go`: Ensure the test overrides the `baseURL` correctly or checks the param if it's implicitly part of the fetch.

## 4. Why this fixes it?
By making the parameter part of the constant definition, we remove the risk of runtime logic skipping the append (e.g. if we mistakenly thought it was already there). It adheres to the "Force" requirement.
