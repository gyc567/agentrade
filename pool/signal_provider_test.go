package pool

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestSignalProvider_GetCoinPool_DefaultCoins(t *testing.T) {
	config := SignalProviderConfig{
		UseDefaultCoins: true,
	}
	p := NewSignalProvider(config)

	coins, err := p.GetCoinPool()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(coins) != len(defaultMainstreamCoins) {
		t.Errorf("Expected %d coins, got %d", len(defaultMainstreamCoins), len(coins))
	}
}

func TestSignalProvider_GetCoinPool_NoURL(t *testing.T) {
	config := SignalProviderConfig{
		UseDefaultCoins: false,
		CoinPoolAPIURL:  "",
	}
	p := NewSignalProvider(config)

	coins, err := p.GetCoinPool()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(coins) != len(defaultMainstreamCoins) {
		t.Errorf("Expected %d coins, got %d", len(defaultMainstreamCoins), len(coins))
	}
}

func TestSignalProvider_GetCoinPool_API(t *testing.T) {
	// Create a mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"success":true,"data":{"coins":[{"pair":"BTCUSDT","score":95.5}],"count":1}}`)
	}))
	defer server.Close()

	tempDir := "test_cache_" + fmt.Sprint(time.Now().UnixNano())
	defer os.RemoveAll(tempDir)

	config := SignalProviderConfig{
		CoinPoolAPIURL: server.URL,
		CacheDir:       tempDir,
	}
	p := NewSignalProvider(config)

	coins, err := p.GetCoinPool()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(coins) != 1 || coins[0].Pair != "BTCUSDT" {
		t.Errorf("Unexpected coins: %v", coins)
	}

	// Verify cache was created
	if _, err := os.Stat(filepath.Join(tempDir, "latest.json")); os.IsNotExist(err) {
		t.Error("Cache file was not created")
	}
}

func TestSignalProvider_GetOITopPositions_API(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"success":true,"data":{"positions":[{"symbol":"SOLUSDT","rank":1,"oi_delta_percent":15.5}],"count":1}}`)
	}))
	defer server.Close()

	tempDir := "test_cache_oi_" + fmt.Sprint(time.Now().UnixNano())
	defer os.RemoveAll(tempDir)

	config := SignalProviderConfig{
		OITopAPIURL: server.URL,
		CacheDir:    tempDir,
	}
	p := NewSignalProvider(config)

	positions, err := p.GetOITopPositions()
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(positions) != 1 || positions[0].Symbol != "SOLUSDT" {
		t.Errorf("Unexpected positions: %v", positions)
	}
}

func TestSignalProvider_GetMergedCoinPool(t *testing.T) {
	coinServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"success":true,"data":{"coins":[{"pair":"BTCUSDT","score":90}],"count":1}}`)
	}))
	defer coinServer.Close()

	oiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprint(w, `{"success":true,"data":{"positions":[{"symbol":"ETHUSDT","rank":1}],"count":1}}`)
	}))
	defer oiServer.Close()

	tempDir := "test_cache_merged_" + fmt.Sprint(time.Now().UnixNano())
	defer os.RemoveAll(tempDir)

	config := SignalProviderConfig{
		CoinPoolAPIURL: coinServer.URL,
		OITopAPIURL:    oiServer.URL,
		CacheDir:       tempDir,
	}
	p := NewSignalProvider(config)

	merged, err := p.GetMergedCoinPool(10)
	if err != nil {
		t.Fatalf("Expected no error, got %v", err)
	}

	if len(merged.AllSymbols) != 2 {
		t.Errorf("Expected 2 symbols, got %d: %v", len(merged.AllSymbols), merged.AllSymbols)
	}
}
