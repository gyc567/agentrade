package main

import (
	"strings"
	"testing"
)

func TestMigrationSQL(t *testing.T) {
	// Verify SQL content
	if len(migrationSQL) == 0 {
		t.Error("Migration SQL is empty")
	}

	expectedKeys := []string{
		"mlion_api_key",
		"mlion_target_topic_id",
		"mlion_news_enabled",
	}

	for _, key := range expectedKeys {
		if !strings.Contains(migrationSQL, key) {
			t.Errorf("Migration SQL missing key: %s", key)
		}
	}

	// Verify Idempotency Safety
	if !strings.Contains(migrationSQL, "ON CONFLICT (key) DO UPDATE") {
		t.Error("Migration SQL missing ON CONFLICT clause. Script must be idempotent.")
	}
}
