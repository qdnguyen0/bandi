-- Seed data for BandiAI demo
-- Run: sqlite3 ./data/bandiAI.db < seed.sql

-- Developer accounts (password: "demo123" bcrypt hash)
INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES
  (1, 'dev@synthlabs.ai', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'dev'),
  (2, 'dev@pixelmind.io', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'dev'),
  (3, 'dev@flowstate.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'dev'),
  (4, 'dev@redshield.sec', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'dev');

-- Agents
INSERT OR IGNORE INTO agents (id, dev_id, name, description, version, price, rental_price, has_trial, category, downloads) VALUES
  (1, 1, 'NeuralScribe Pro', 'Advanced language model agent for document generation, summarization, and intelligent text transformation. Supports GPT-style prompting, chain-of-thought reasoning, and structured output formatting for enterprise workflows.', '2.1.0', 49.0, 9.0, 1, 'NLP', 12847),
  (2, 2, 'VisionCore X', 'Real-time image analysis and object detection agent with multimodal understanding capabilities. Supports YOLO-based detection, OCR, image segmentation, and visual question answering with sub-100ms latency.', '1.4.0', 79.0, 14.0, 0, 'Vision', 8321),
  (3, 3, 'AutoFlow Agent', 'Intelligent workflow automation agent that orchestrates multi-step tasks across APIs, databases, and cloud services. Features a visual DAG builder, retry logic, and real-time execution monitoring with Slack/Discord alerts.', '3.0.1', 39.0, 7.0, 1, 'Automation', 21053),
  (4, 1, 'DataPulse Analytics', 'Predictive analytics and anomaly detection agent for real-time business intelligence. Connects to SQL, NoSQL, and streaming sources. Features auto-generated dashboards, trend forecasting, and configurable alert thresholds.', '1.2.0', 99.0, 18.0, 0, 'Analytics', 5614),
  (5, 4, 'CipherGuard AI', 'Security threat detection and vulnerability assessment agent powered by behavioral analysis. Performs SAST/DAST scanning, dependency auditing, secrets detection, and generates compliance reports for SOC2 and ISO 27001.', '2.0.0', 129.0, 22.0, 1, 'Security', 3892),
  (6, 2, 'LangBridge Translator', 'Multi-lingual neural translation agent with context-aware cultural adaptation for 100+ languages. Features glossary support, tone control, batch processing, and real-time streaming translation for chat applications.', '4.1.0', 29.0, 5.0, 1, 'NLP', 34521),
  (7, 4, 'SentinelWatch', 'Real-time network intrusion detection agent with ML-powered traffic analysis. Monitors ingress/egress patterns, flags suspicious payloads, and integrates with PagerDuty, OpsGenie, and custom webhook endpoints.', '1.1.0', 89.0, 16.0, 0, 'Security', 2104),
  (8, 2, 'PixelForge Studio', 'AI-powered image generation and editing agent. Supports inpainting, outpainting, style transfer, upscaling, and batch processing. Runs locally with GPU acceleration or via cloud inference endpoints.', '2.3.0', 59.0, 11.0, 1, 'Vision', 15230),
  (9, 3, 'PipelinePilot', 'CI/CD automation agent that generates, optimizes, and monitors deployment pipelines. Supports GitHub Actions, GitLab CI, Jenkins, and ArgoCD. Auto-detects project type and suggests optimal pipeline configurations.', '1.5.0', 45.0, 8.0, 1, 'Automation', 9876),
  (10, 1, 'InsightEngine', 'Natural language BI agent that turns plain English questions into SQL queries, charts, and executive summaries. Connects to PostgreSQL, MySQL, BigQuery, and Snowflake with automatic schema discovery.', '1.0.0', 119.0, 21.0, 1, 'Analytics', 4320);
