package trader

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOKXSimulatedTradingHeader(t *testing.T) {
	tests := []struct {
		name        string
		isSimulated bool
		expectedVal string
	}{
		{"Real Trading", false, "0"},
		{"Simulated Trading", true, "1"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a mock server to capture headers
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				val := r.Header.Get("x-simulated-trading")
				if val != tt.expectedVal {
					t.Errorf("Expected x-simulated-trading header %s, got %s", tt.expectedVal, val)
				}
				w.WriteHeader(http.StatusOK)
				w.Write([]byte(`{"code":"0","data":[]}`))
			}))
			defer server.Close()

			trader := &OKXTrader{
				apiKey:      "key",
				secretKey:   "secret",
				passphrase:  "pass",
				baseURL:     server.URL,
				isSimulated: tt.isSimulated,
				client:      &http.Client{},
			}

			// Trigger a request
			_, _ = trader.makeRequest("GET", "/api/v5/account/balance", nil)
		})
	}
}
