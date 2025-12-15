# Feature Proposal: Real-time News Integration (Mlion.ai)

## 1. Context & Objectives
To enhance our market intelligence capabilities, we will integrate a new real-time news source from **Mlion.ai**.
The goal is to fetch real-time crypto news and push it to a specific Telegram topic.

- **Source**: Mlion.ai Real-time News API.
- **Destination**: Telegram Topic `17758` (Channel: `monnaire_capital_research`).
- **Value**: Provides low-latency market updates to the research team.

## 2. Technical Specifications

### 2.1 External Interface (Mlion.ai)
- **Endpoint**: `GET https://api.mlion.ai/v2/api/news/real/time`
- **Authentication**: Header `X-API-KEY: c559b9a8-80c2-4c17-8c31-bb7659b12b52`
- **Response Format**:
  ```json
  {
    "code": 200,
    "data": [
      {
        "news_id": 113310,
        "title": "Vitalik Buterin Sells...",
        "content": "Mlion.ai News, ...",
        "url": "...",
        "createTime": "2025-12-15 11:30:17",
        "sentiment": 0,
        "symbol": "ETH"
      }
    ]
  }
  ```

### 2.2 System Architecture
We will extend the existing `service/news` package to support multiple sources using a composite pattern.

#### Components:
1.  **Fetcher Interface**: Existing interface.
    -   `MlionFetcher`: Implements `Fetcher`.
    -   `FinnhubFetcher`: Existing implementation.
2.  **Service**:
    -   Hold a slice `[]Fetcher` instead of a single instance.
    -   **Routing Map**: `map[string]int` storing `Source Name -> Telegram Topic ID`.
3.  **Data Handling**:
    -   **ID**: Mlion `news_id` is an integer, compatible with `Article.ID` (`int64`).
    -   **Timestamp**: Mlion `createTime` is a string (`YYYY-MM-DD HH:MM:SS`). Must be parsed to Unix timestamp.

## 3. Implementation Plan

### Phase 1: Mlion Client Implementation
-   Create `service/news/mlion.go`.
-   Define `MlionFetcher` struct.
-   Implement `FetchNews(category string)`:
    -   Ignores `category` argument (Mlion API doesn't seem to use it in this endpoint, or we map it).
    -   Parses JSON response.
    -   Converts `createTime` to Unix timestamp.
    -   Maps `news_id` to `Article.ID`.

### Phase 2: Service Refactoring
-   Modify `service/news/service.go`:
    -   Change `fetcher Fetcher` to `fetchers []Fetcher`.
    -   Add `topicRouter map[string]int`.
    -   Update `loadConfig` to:
        -   Initialize `FinnhubFetcher` (if enabled).
        -   Initialize `MlionFetcher` (if enabled).
        -   Populate `topicRouter` from config:
            -   Finnhub -> `telegram_message_thread_id`
            -   Mlion -> `mlion_target_topic_id`
    -   Update `processAllCategories`:
        -   Iterate over `s.fetchers`.
        -   For each fetcher, call `FetchNews`.
        -   Lookup target topic in `topicRouter` using `fetcher.Name()`.
        -   Pass topic ID to `notifier.Send`.

### Phase 3: Configuration
-   Add SQL/Config entries for:
    -   `mlion_api_key`: `c559b9a8-80c2-4c17-8c31-bb7659b12b52`
    -   `mlion_target_topic_id`: `17758`
    -   `mlion_news_enabled`: `true`

## 4. Verification
-   **Unit Tests**: Test `MlionFetcher` parsing logic (especially time parsing).
-   **Integration Test**: Verify Service iterates all fetchers and routes messages correctly.
