package news

import (
        "encoding/json"
        "fmt"
        "net/http"
        "time"
)

const finnhubBaseURL = "https://finnhub.io/api/v1/news"

// FinnhubFetcher 实现 Fetcher 接口
type FinnhubFetcher struct {
        apiKey string
        client *http.Client
}

// NewFinnhubFetcher 创建 Finnhub 抓取器
func NewFinnhubFetcher(apiKey string) *FinnhubFetcher {
        return &FinnhubFetcher{
                apiKey: apiKey,
                client: &http.Client{Timeout: 10 * time.Second},
        }
}

// Name 返回抓取器名称
func (f *FinnhubFetcher) Name() string {
        return "Finnhub"
}

// FetchNews 从 Finnhub 获取新闻
func (f *FinnhubFetcher) FetchNews(category string) ([]Article, error) {
        url := fmt.Sprintf("%s?category=%s&token=%s", finnhubBaseURL, category, f.apiKey)
        
        resp, err := f.client.Get(url)
        if err != nil {
                return nil, fmt.Errorf("failed to fetch news: %w", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
                return nil, fmt.Errorf("finnhub api returned status: %d", resp.StatusCode)
        }

        var articles []Article
        if err := json.NewDecoder(resp.Body).Decode(&articles); err != nil {
                return nil, fmt.Errorf("failed to decode response: %w", err)
        }

        // 填充 Category 字段，因为 API 响应中可能不包含
        for i := range articles {
                articles[i].Category = category
        }

        return articles, nil
}
