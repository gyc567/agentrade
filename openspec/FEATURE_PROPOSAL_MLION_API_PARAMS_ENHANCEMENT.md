# Feature Proposal: Enhance Mlion API Request Parameters

## 1. Context & Objectives
The Mlion API integration currently only includes the `is_hot=Y` filter. To ensure the news fetching is precise and optimized for the target audience (Chinese language, specific batch size), we need to incorporate additional parameters as per the provided reference URL.

## 2. Technical Design

### 2.1 API Endpoint Enhancement
-   **Current `mlionBaseURL`**: `https://api.mlion.ai/v2/api/news/real/time?is_hot=Y`
-   **Target `mlionBaseURL`**: `https://api.mlion.ai/v2/api/news/real/time?language=cn&time_zone=Asia%2FShanghai&num=100&page=1&client=mlion&is_hot=Y`
-   **Parameters to Add**:
    -   `language=cn`: Specify Chinese language news.
    -   `time_zone=Asia%2FShanghai`: Explicitly set the timezone for API response processing, ensuring consistency.
    -   `num=100`: Request a batch size of 100 articles per fetch.
    -   `page=1`: Request the first page of results.
    -   `client=mlion`: Identify the client.

### 2.2 Impact Analysis
-   **Language Filtering**: Ensures only Chinese news is fetched, aligning with the target community.
-   **Batch Size**: `num=100` will fetch a reasonable batch, potentially reducing API calls for the same volume of hot news.
-   **Timezone Consistency**: Explicitly requesting `Asia/Shanghai` can help prevent discrepancies if the API has default timezone behaviors.

## 3. Implementation Plan

### Phase 1: Code Modification
-   Update `service/news/mlion.go`:
    -   Modify the `mlionBaseURL` constant to include all new parameters.

### Phase 2: Verification
-   Update `service/news/mlion_test.go`:
    -   Modify `TestMlionFetcher_Constant` to verify all parameters are present in `f.baseURL`.
    -   Modify `TestMlionFetcher_FetchNews` mock handler to verify all parameters in `r.URL.Query()`.

## 4. Testing
-   Run all existing unit and integration tests to ensure no regressions.
-   Manually verify the fetched news via a script to check language and volume.
