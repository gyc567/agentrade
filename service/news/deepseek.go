package news

import (
        "bytes"
        "encoding/json"
        "fmt"
        "log"
        "net/http"
        "strings"
        "time"
)

// DeepSeekProcessor 实现 AIProcessor 接口
type DeepSeekProcessor struct {
        apiKey string
        apiURL string
        client *http.Client
        targetLang string
}

// NewDeepSeekProcessor 创建 DeepSeek 处理器
func NewDeepSeekProcessor(apiKey, apiURL, targetLang string) *DeepSeekProcessor {
        if apiURL == "" {
                apiURL = "https://api.deepseek.com/chat/completions"
        }
        return &DeepSeekProcessor{
                apiKey: apiKey,
                apiURL: apiURL,
                targetLang: targetLang,
                client: &http.Client{Timeout: 10 * time.Second}, // 10秒硬超时
        }
}

// AIResponse 定义 DeepSeek 返回的 JSON 结构
type AIResponse struct {
        Choices []struct {
                Message struct {
                        Content string `json:"content"`
                } `json:"message"`
        } `json:"choices"`
}

// AIOutput 定义我们期望 AI 输出的 JSON 结构
type AIOutput struct {
        Title     string `json:"title"`
        Summary   string `json:"summary"`
        Sentiment string `json:"sentiment"`
}

func (p *DeepSeekProcessor) Process(article *Article) error {
        // 构造 Prompt
        prompt := fmt.Sprintf(`You are a professional crypto market analyst.
Task: Translate the news into %s and summarize it.
Input Headline: %s
Input Summary: %s

Output strictly in JSON format:
{
  "title": "Translated Headline",
  "summary": "One sentence summary",
  "sentiment": "POSITIVE/NEGATIVE/NEUTRAL"
}`, p.targetLang, article.Headline, article.Summary)

        // 构造请求体
        reqBody := map[string]interface{}{
                "model": "deepseek-chat",
                "messages": []map[string]string{
                        {"role": "system", "content": "You are a helpful assistant that outputs only JSON."},
                        {"role": "user", "content": prompt},
                },
                "response_format": map[string]string{"type": "json_object"}, // 强制 JSON 输出
                "temperature": 0.3,
        }

        jsonBody, err := json.Marshal(reqBody)
        if err != nil {
                return fmt.Errorf("marshal request failed: %w", err)
        }

        // 发送请求
        req, err := http.NewRequest("POST", p.apiURL, bytes.NewBuffer(jsonBody))
        if err != nil {
                return fmt.Errorf("create request failed: %w", err)
        }

        req.Header.Set("Content-Type", "application/json")
        req.Header.Set("Authorization", "Bearer "+p.apiKey)

        // 执行请求 (带重试逻辑?? 暂时保持简单，依赖 Service 层的降级)
        resp, err := p.client.Do(req)
        if err != nil {
                return fmt.Errorf("api request failed: %w", err)
        }
        defer resp.Body.Close()

        if resp.StatusCode != http.StatusOK {
                return fmt.Errorf("api returned status: %d", resp.StatusCode)
        }

        // 解析响应
        var aiResp AIResponse
        if err := json.NewDecoder(resp.Body).Decode(&aiResp); err != nil {
                return fmt.Errorf("decode response failed: %w", err)
        }

        if len(aiResp.Choices) == 0 {
                return fmt.Errorf("no choices in response")
        }

        content := aiResp.Choices[0].Message.Content
        
        // 解析 AI 输出的 JSON 内容
        var output AIOutput
        // 有时候 AI 可能会在 JSON 外面包一些 Markdown 代码块 ```json ... ```，需要清洗
        cleanContent := cleanJSON(content)
        
        if err := json.Unmarshal([]byte(cleanContent), &output); err != nil {
                log.Printf("⚠️ AI Response Parse Error. Raw: %s", content)
                return fmt.Errorf("parse ai output json failed: %w", err)
        }

        // 更新文章对象
        article.TranslatedHeadline = output.Title
        article.TranslatedSummary = output.Summary
        article.Sentiment = output.Sentiment
        article.AIProcessed = true

        return nil
}

func cleanJSON(s string) string {
        s = strings.TrimSpace(s)
        s = strings.TrimPrefix(s, "```json")
        s = strings.TrimPrefix(s, "```")
        s = strings.TrimSuffix(s, "```")
        return strings.TrimSpace(s)
}
