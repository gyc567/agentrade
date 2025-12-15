# Audit Report: Real-time News Integration (Mlion.ai)

## 1. Executive Summary
The proposal `FEATURE_PROPOSAL_REALTIME_NEWS_MLION.md` is **APPROVED** with specific architectural recommendations regarding ID management and Fetcher abstraction. The plan aligns well with the existing `service/news` architecture but requires careful handling of data types and routing logic to avoid regressions.

## 2. Architectural Analysis

### 2.1 Fetcher Abstraction (High Priority)
The current `Service` struct holds a single `fetcher Fetcher`. The proposal suggests adding `mlionFetcher` as a separate field.
-   **Recommendation**: To maintain scalability, do not add ad-hoc fields like `mlionFetcher`. Instead, change `fetcher` to a slice `[]Fetcher` or create a `CompositeFetcher` that aggregates results.
-   **MVP approach**: If strictly limited to 2 sources, two specific fields are acceptable, but iterating over a list of interfaces is the preferred "Clean Architecture" approach.

### 2.2 Data Type Compatibility (Critical)
The existing `Article` struct uses `int64` for `ID`.
-   **Risk**: If Mlion.ai uses UUIDs or alphanumeric IDs, they will not fit into `int64`.
-   **Mitigation**:
    1.  **Check Mlion API**: Verify the ID format immediately.
    2.  **Fallback**: If IDs are strings, either refactor `Article.ID` to `string` (affects database/state store) or generate a deterministic `int64` hash from the Mlion string ID (e.g., `fnv64a`). Given the `int64` is used in `sentArticleIDs` and `GetNewsState` (DB), a hashing strategy is less invasive than a full DB refactor.

### 2.3 Topic Routing
The proposal correctly identifies the need for source-based routing.
-   **Mechanism**: The `Article` struct already has a `Source` field.
-   **Logic**: The routing logic should not be hardcoded in `ProcessCategory`. Instead, pass the `targetTopicID` to the `Process` function or derive it from a configuration map `map[SourceName]TopicID`.

## 3. Implementation Recommendations

1.  **MlionFetcher**: Implement the `Fetcher` interface. Ensure `Name()` returns "Mlion".
2.  **ID Hashing**: In `MlionFetcher.FetchNews`, if the upstream ID is a string, hash it to `int64` to fit the existing model without breaking DB schemas.
3.  **Service Loop**:
    ```go
    // Conceptual change in Service
    type Service struct {
        fetchers []Fetcher // Support multiple sources
        // ...
    }
    
    func (s *Service) processAllCategories() {
        for _, fetcher := range s.fetchers {
             // Logic to fetch from this fetcher
             // Logic to determine target topic based on fetcher.Name()
        }
    }
    ```
4.  **Configuration**: Ensure `mlion_target_topic_id` is loaded into a map for easy lookup.

## 4. Conclusion
Proceed with implementation. Pay special attention to the **ID type** issue. The hashing approach is recommended to avoid breaking existing Finnhub state tracking.
