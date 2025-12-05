package news

import (
        "fmt"
        "testing"
)

type MockAIProcessor struct {
        ShouldFail bool
}

func (m *MockAIProcessor) Process(article *Article) error {
        if m.ShouldFail {
                return fmt.Errorf("mock ai failure")
        }
        article.TranslatedHeadline = "测试标题"
        article.TranslatedSummary = "测试摘要"
        article.Sentiment = "POSITIVE"
        article.AIProcessed = true
        return nil
}

func TestService_ProcessCategory_WithAI(t *testing.T) {
        // Setup
        mockStore := &MockStateStore{
                LastID: 0,
                Configs: map[string]string{
                        "telegram_news_enabled": "true", 
                        "deepseek_api_key": "test",
                        "telegram_message_thread_id": "0",
                },
        }
        mockFetcher := &MockFetcher{
                News: []Article{
                        {ID: 10, Datetime: 100, Headline: "Original EN", Summary: "Summary EN"},
                },
        }
        mockNotifier := &MockNotifier{}
        mockAI := &MockAIProcessor{}

        service := NewService(mockStore)
        service.fetcher = mockFetcher
        service.notifier = mockNotifier
        service.aiProcessor = mockAI
        service.enabled = true

        // Execute
        service.ProcessCategory("crypto")

        // Verify
        if len(mockNotifier.SentMessages) != 1 {
                t.Fatalf("Expected 1 message, got %d", len(mockNotifier.SentMessages))
        }
        
        msg := mockNotifier.SentMessages[0]
        if !contains(msg, "测试标题") {
                t.Errorf("Expected translated title, got: %s", msg)
        }
        if !contains(msg, "🟢") {
                t.Errorf("Expected sentiment icon, got: %s", msg)
        }
}

func TestService_ProcessCategory_AIFallback(t *testing.T) {
        // Setup
        mockStore := &MockStateStore{
                Configs: map[string]string{"telegram_news_enabled": "true"},
        }
        mockFetcher := &MockFetcher{
                News: []Article{{ID: 10, Datetime: 100, Headline: "Original EN"}},
        }
        mockNotifier := &MockNotifier{}
        mockAI := &MockAIProcessor{ShouldFail: true} // AI Fails

        service := NewService(mockStore)
        service.fetcher = mockFetcher
        service.notifier = mockNotifier
        service.aiProcessor = mockAI
        service.enabled = true

        // Execute
        service.ProcessCategory("crypto")

        // Verify
        if len(mockNotifier.SentMessages) == 0 {
                t.Fatal("Expected 1 message, got 0")
        }
        msg := mockNotifier.SentMessages[0]
        if contains(msg, "测试标题") {
                t.Errorf("Expected original title (fallback), but got translated one")
        }
        if !contains(msg, "Original EN") {
                t.Errorf("Expected original title, got: %s", msg)
        }
}
