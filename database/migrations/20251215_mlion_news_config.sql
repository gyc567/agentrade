-- Add Mlion News Configuration

INSERT INTO system_config (key, value) VALUES ('mlion_api_key', 'c559b9a8-80c2-4c17-8c31-bb7659b12b52') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO system_config (key, value) VALUES ('mlion_target_topic_id', '17758') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO system_config (key, value) VALUES ('mlion_news_enabled', 'true') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
