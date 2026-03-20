-- Seed data for BandiAI demo
-- Run: sqlite3 ./data/bandiAI.db < seed.sql

-- Developer accounts (plaintext password: "demo123")
INSERT OR IGNORE INTO users (id, username, email, password, first_name, last_name, role) VALUES
  (1, 'synthlabs', 'dev@synthlabs.ai', 'demo123', 'Synth', 'Labs', 'dev'),
  (2, 'pixelmind', 'dev@pixelmind.io', 'demo123', 'Pixel', 'Mind', 'dev'),
  (3, 'flowstate', 'dev@flowstate.dev', 'demo123', 'Flow', 'State', 'dev'),
  (4, 'redshield', 'dev@redshield.sec', 'demo123', 'Red', 'Shield', 'dev');

-- User profile: Quan Nguyen (plaintext password: "pass123")
INSERT OR IGNORE INTO users (id, username, email, password, first_name, last_name, role) VALUES
  (5, 'qnguyen', 'quannguyenca15@icloud.com', 'pass123', 'Quan', 'Nguyen', 'user');

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

-- Additional agents (IDs 11-110)
INSERT OR IGNORE INTO agents (id, dev_id, name, description, version, price, rental_price, has_trial, category, downloads) VALUES
  -- Analytics (35 agents: 11-45)
  (11, 1, 'MetricVault', 'Aggregates metrics from Datadog, Prometheus, and CloudWatch into a unified neon dashboard. Surfaces anomalies and SLA breaches with sub-second latency.', '1.3.0', 89.0, 15.0, 1, 'Analytics', 7842),
  (12, 2, 'NeonForecast', 'Time-series forecasting agent using transformer-based models to predict KPIs up to 90 days out. Exports reports in PDF, CSV, or direct Slack digest.', '2.0.0', 79.0, 14.0, 0, 'Analytics', 5120),
  (13, 3, 'GhostMetrics', 'Silent background analytics agent that profiles user behavior patterns without impacting frontend performance. Streams events to Kafka or S3.', '1.1.0', 49.0, 9.0, 1, 'Analytics', 11340),
  (14, 4, 'ChromaStats', 'Colorized funnel analysis agent for e-commerce and SaaS pipelines. Detects drop-off stages and auto-generates A/B test recommendations.', '1.0.0', 59.0, 10.0, 0, 'Analytics', 4230),
  (15, 1, 'SynthBoard', 'Real-time executive dashboard agent that synthesizes data from 20+ sources into a single live view. Supports voice-query via WebSpeech API.', '3.1.0', 119.0, 21.0, 1, 'Analytics', 6780),
  (16, 2, 'QuantumLens', 'Multi-dimensional cohort analysis agent for mobile apps and web platforms. Correlates retention, revenue, and engagement signals into heatmap grids.', '2.2.0', 99.0, 18.0, 0, 'Analytics', 3950),
  (17, 3, 'PulseTrace', 'Infrastructure health monitoring agent that correlates deployment events with performance degradation. Pinpoints root causes using causal inference models.', '1.4.0', 69.0, 12.0, 1, 'Analytics', 8901),
  (18, 4, 'VectorScope', 'Embedding-space analytics agent for ML teams. Visualizes high-dimensional model outputs, detects data drift, and alerts on distribution shifts in production.', '1.0.0', 89.0, 16.0, 0, 'Analytics', 2870),
  (19, 1, 'NightOwl Analytics', 'Scheduled overnight batch analytics agent that processes millions of rows before market open. Delivers formatted boardroom-ready summaries by 7 AM.', '2.1.0', 109.0, 19.0, 1, 'Analytics', 4560),
  (20, 2, 'HexDash', 'Hexagonal grid dashboard agent for supply chain visibility. Maps inventory, shipments, and demand signals onto interactive spatial overlays.', '1.2.0', 79.0, 14.0, 0, 'Analytics', 3210),
  (21, 3, 'BinaryBloom', 'Log analytics agent that clusters error patterns and surfaces actionable insights. Integrates with Loki, Splunk, and Elastic in under five minutes.', '1.5.0', 59.0, 11.0, 1, 'Analytics', 9870),
  (22, 4, 'CortexFlow', 'Neural attribution analytics agent for marketing spend. Uses Shapley values to assign credit across 30+ touchpoints and channels.', '2.0.0', 99.0, 17.0, 0, 'Analytics', 5430),
  (23, 1, 'SpectralDrift', 'Statistical drift detection agent for data pipelines. Monitors schema changes, volume anomalies, and value distribution shifts with configurable sensitivity.', '1.3.0', 69.0, 12.0, 1, 'Analytics', 7120),
  (24, 2, 'GridPulse', 'Real-time grid analytics for IoT sensor networks. Processes 100K+ events per second and visualizes spatial anomalies on an interactive map.', '1.1.0', 89.0, 15.0, 0, 'Analytics', 3340),
  (25, 3, 'ZeroCrossing', 'Financial time-series analytics agent that detects regime changes and market phase transitions using zero-crossing signal analysis.', '2.3.0', 129.0, 22.0, 1, 'Analytics', 2900),
  (26, 4, 'ShadowIndex', 'Privacy-preserving analytics agent that computes aggregate metrics on encrypted datasets without exposing individual records.', '1.0.0', 119.0, 20.0, 0, 'Analytics', 1870),
  (27, 1, 'CyberPivot', 'OLAP-style pivot agent for exploratory data analysis. Supports drag-and-drop dimension slicing, drill-down, and natural language query via LLM bridge.', '2.1.0', 79.0, 14.0, 1, 'Analytics', 6450),
  (28, 2, 'PlasmaReport', 'Automated report generation agent that queries your data warehouse and produces polished slide decks via Google Slides or PowerPoint API.', '1.4.0', 69.0, 12.0, 0, 'Analytics', 4100),
  (29, 3, 'OracleGrid', 'Predictive inventory agent for retail and logistics. Forecasts stockout events 72 hours in advance using XGBoost models trained on historical POS data.', '1.2.0', 99.0, 18.0, 1, 'Analytics', 5780),
  (30, 4, 'NeonSigma', 'Statistical hypothesis testing agent that automates A/B test analysis, power calculations, and significance reporting for product teams.', '1.0.0', 49.0, 9.0, 0, 'Analytics', 8230),
  (31, 1, 'PhotonTrail', 'Customer journey analytics agent that reconstructs multi-device paths and attribution trees from raw clickstream data.', '2.0.0', 89.0, 15.0, 1, 'Analytics', 3670),
  (32, 2, 'CryptoLens', 'On-chain analytics agent for DeFi and NFT markets. Tracks wallet flows, liquidity events, and MEV activity with real-time alerts.', '1.3.0', 109.0, 19.0, 0, 'Analytics', 6120),
  (33, 3, 'WireFrame Analytics', 'Product analytics agent for UX teams. Combines heatmaps, session replays, and funnel data into a single AI-narrated insight feed.', '1.1.0', 59.0, 10.0, 1, 'Analytics', 10200),
  (34, 4, 'NullSpace Metrics', 'Data quality analytics agent that profiles missing values, outliers, and schema violations across your entire data lake.', '1.0.0', 49.0, 8.0, 0, 'Analytics', 7430),
  (35, 1, 'ReactorBI', 'Event-driven business intelligence agent that triggers automated responses when KPIs breach configured thresholds.', '2.2.0', 79.0, 14.0, 1, 'Analytics', 5890),
  (36, 2, 'TeraScope', 'Petabyte-scale analytics agent optimized for BigQuery and Redshift. Rewrites slow queries and recommends partition strategies automatically.', '1.4.0', 119.0, 21.0, 0, 'Analytics', 4450),
  (37, 3, 'NeonHeatmap', 'Real-time user behavior heatmap agent with click density overlays and scroll depth analytics. Supports SPA frameworks and server-rendered pages.', '1.0.0', 39.0, 7.0, 1, 'Analytics', 14560),
  (38, 4, 'CarbonTrace', 'Sustainability analytics agent that calculates carbon footprint per workload, server rack, and cloud region for ESG reporting.', '1.1.0', 89.0, 16.0, 0, 'Analytics', 2340),
  (39, 1, 'MirrorMind', 'Competitor intelligence analytics agent that scrapes public data, pricing pages, and job postings to surface strategic insights weekly.', '2.0.0', 99.0, 17.0, 1, 'Analytics', 6780),
  (40, 2, 'AlphaStream', 'Algorithmic trading analytics agent that backtests strategies against decade-long market data and surfaces optimal entry/exit signal parameters.', '1.5.0', 149.0, 25.0, 0, 'Analytics', 1920),
  (41, 3, 'FogBuster', 'Revenue analytics agent that reconciles billing discrepancies across Stripe, Zuora, and Chargebee in real time.', '1.2.0', 69.0, 12.0, 1, 'Analytics', 5340),
  (42, 4, 'SilverFin', 'SaaS financial analytics agent covering MRR, churn, LTV, and CAC with cohort breakdowns and investor-ready exports.', '2.1.0', 109.0, 19.0, 0, 'Analytics', 4120),
  (43, 1, 'CelestialKPI', 'Goal-tracking analytics agent that maps OKRs to underlying metrics and sends weekly progress reports to Notion or Confluence.', '1.0.0', 59.0, 10.0, 1, 'Analytics', 7890),
  (44, 2, 'VortexAudit', 'Data lineage and audit trail agent for regulated industries. Traces every transformation step and generates audit logs for GDPR and HIPAA compliance.', '1.3.0', 129.0, 22.0, 0, 'Analytics', 2760),
  (45, 3, 'NanoSignal', 'Micro-analytics agent designed for edge devices and embedded systems. Computes on-device statistical summaries with under 5 MB memory footprint.', '1.0.0', 29.0, 5.0, 1, 'Analytics', 9650),

  -- Automation (35 agents: 46-80)
  (46, 4, 'NexusBot', 'Multi-cloud resource provisioning agent that spins up environments from YAML blueprints. Supports AWS, GCP, and Azure with drift detection and auto-remediation.', '2.0.0', 59.0, 10.0, 1, 'Automation', 18430),
  (47, 1, 'ChromeWire', 'Browser automation agent built on Playwright. Records human workflows and replays them as robust scripts with smart selector fallback.', '1.3.0', 39.0, 7.0, 0, 'Automation', 22110),
  (48, 2, 'GhostScheduler', 'Intelligent task scheduling agent that adapts job queues based on resource availability and SLA deadlines. Replaces cron with dynamic priority routing.', '1.1.0', 49.0, 9.0, 1, 'Automation', 15670),
  (49, 3, 'SynapseRouter', 'Event-driven automation agent that routes messages between Kafka, RabbitMQ, SQS, and Pub/Sub with transformation rules and dead-letter handling.', '2.2.0', 79.0, 14.0, 0, 'Automation', 8970),
  (50, 4, 'NeonSweeper', 'Automated cloud cost optimization agent that identifies idle resources, right-sizes instances, and applies savings plans with one-click approval.', '1.4.0', 69.0, 12.0, 1, 'Automation', 12340),
  (51, 1, 'WireWeaver', 'API integration automation agent that discovers REST and GraphQL endpoints, generates typed clients, and wires them into your codebase automatically.', '1.0.0', 45.0, 8.0, 0, 'Automation', 11230),
  (52, 2, 'QuantumCron', 'Distributed cron replacement agent with sub-second precision, leader election, and a web UI for real-time job monitoring and history replay.', '2.1.0', 55.0, 10.0, 1, 'Automation', 9870),
  (53, 3, 'HexForge', 'Infrastructure-as-code automation agent that translates architecture diagrams into Terraform or Pulumi modules with automated security best-practices.', '1.2.0', 89.0, 16.0, 0, 'Automation', 6450),
  (54, 4, 'GlitchHunter', 'Automated regression testing agent that detects UI and API regressions by comparing snapshots across deployments. Integrates with Jira for auto-ticketing.', '1.5.0', 49.0, 9.0, 1, 'Automation', 17890),
  (55, 1, 'ShadowSync', 'Database synchronization agent that keeps replica sets, read replicas, and CDN caches in sync using event-sourced change feeds.', '2.0.0', 79.0, 14.0, 0, 'Automation', 7230),
  (56, 2, 'CyberSweep', 'Automated compliance sweep agent that scans cloud configurations against CIS benchmarks and auto-remediates misconfigured security groups and IAM policies.', '1.1.0', 99.0, 17.0, 1, 'Automation', 5340),
  (57, 3, 'MatrixDispatch', 'Intelligent alert dispatching agent that deduplicates, correlates, and routes incidents to the right on-call engineer using rotation schedules.', '1.3.0', 59.0, 10.0, 0, 'Automation', 9120),
  (58, 4, 'BinaryOrchid', 'Serverless workflow automation agent for Lambda and Cloud Functions. Composes functions into DAGs with retry policies and distributed tracing.', '1.0.0', 45.0, 8.0, 1, 'Automation', 13450),
  (59, 1, 'IronThread', 'Long-running background job agent with persistent state, checkpointing, and resume-on-failure. Handles multi-hour ETL and ML training workflows.', '2.3.0', 69.0, 12.0, 0, 'Automation', 8760),
  (60, 2, 'VoltAgent', 'Low-latency RPA agent for legacy desktop applications. Drives keyboard/mouse automation with ML-based screen understanding on Windows and Linux.', '1.4.0', 79.0, 14.0, 1, 'Automation', 10230),
  (61, 3, 'PhotonLoop', 'Continuous feedback loop automation agent that monitors deployment metrics and auto-rolls back or scales based on predefined health signals.', '1.0.0', 55.0, 10.0, 0, 'Automation', 14320),
  (62, 4, 'SignalCraft', 'Event sourcing automation agent that replays historical event streams to rebuild state, populate new read models, or debug production incidents.', '2.1.0', 89.0, 15.0, 1, 'Automation', 6870),
  (63, 1, 'PrismForge', 'Multi-tenant configuration management agent that tracks drift across hundreds of services and enforces golden path standards via GitOps workflows.', '1.2.0', 69.0, 12.0, 0, 'Automation', 7640),
  (64, 2, 'EchoBot', 'Slack and Teams automation agent that monitors conversations for action items, creates tickets, schedules meetings, and updates project boards automatically.', '1.1.0', 29.0, 5.0, 1, 'Automation', 28900),
  (65, 3, 'ZeroLatency', 'Streaming data pipeline automation agent that builds and deploys Flink and Kafka Streams topologies from SQL-like declarative config files.', '2.0.0', 99.0, 18.0, 0, 'Automation', 5120),
  (66, 4, 'NeonMigrator', 'Database migration automation agent that generates, validates, and rolls back schema changes with zero-downtime blue/green strategies.', '1.3.0', 59.0, 10.0, 1, 'Automation', 11670),
  (67, 1, 'CryptoForge', 'Secret rotation automation agent that cycles API keys, TLS certificates, and database credentials across all services without manual intervention.', '1.0.0', 79.0, 14.0, 0, 'Automation', 8920),
  (68, 2, 'PulseWorker', 'Distributed worker pool agent that auto-scales processing threads based on queue depth and CPU utilization. Supports Redis, SQS, and NATS backends.', '2.2.0', 49.0, 9.0, 1, 'Automation', 16780),
  (69, 3, 'GridRelay', 'Cross-cloud load balancing automation agent that shifts traffic between AWS and GCP based on latency, cost, and health signals.', '1.1.0', 89.0, 16.0, 0, 'Automation', 4560),
  (70, 4, 'AxonRunner', 'Headless test automation agent that executes Playwright, Cypress, and Selenium suites in parallel across browser matrix with flakiness detection.', '1.4.0', 55.0, 10.0, 1, 'Automation', 19870),
  (71, 1, 'NightForge', 'Off-hours maintenance automation agent that applies OS patches, rotates logs, rebuilds indexes, and runs vacuum jobs during configured maintenance windows.', '2.0.0', 45.0, 8.0, 0, 'Automation', 12430),
  (72, 2, 'SilverThread', 'Workflow orchestration agent that connects no-code tools like Airtable, Notion, and Webflow via a unified automation layer with version control.', '1.3.0', 35.0, 6.0, 1, 'Automation', 21560),
  (73, 3, 'CortexTrigger', 'AI-powered trigger agent that uses natural language rules to define automation conditions. Eliminates YAML config by letting you describe workflows in plain English.', '1.0.0', 39.0, 7.0, 0, 'Automation', 17240),
  (74, 4, 'HorizonDeploy', 'Progressive delivery automation agent supporting canary, feature flag, and blue/green deployments with automatic traffic promotion and instant rollback.', '2.1.0', 79.0, 14.0, 1, 'Automation', 9340),
  (75, 1, 'OmegaSweep', 'Data cleanup automation agent that purges expired records, archives cold storage, and enforces retention policies across relational and document databases.', '1.2.0', 49.0, 9.0, 0, 'Automation', 8120),
  (76, 2, 'MachineSpider', 'Web scraping automation agent that adapts to page structure changes using visual diffing and automatically updates selectors to maintain extract accuracy.', '1.5.0', 45.0, 8.0, 1, 'Automation', 23450),
  (77, 3, 'QuantumGate', 'Feature flag automation agent that ties flag rollout percentages to real-time error rates, latency metrics, and business KPIs for safer releases.', '1.0.0', 55.0, 10.0, 0, 'Automation', 10780),
  (78, 4, 'PhoenixReboot', 'Self-healing infrastructure agent that detects failing pods, VMs, and containers and automatically initiates recovery procedures before alerts fire.', '2.3.0', 99.0, 17.0, 1, 'Automation', 7650),
  (79, 1, 'LuminousSync', 'File synchronization automation agent for distributed teams. Handles conflict resolution, version history, and selective sync across S3, GCS, and local storage.', '1.1.0', 39.0, 7.0, 0, 'Automation', 14230),
  (80, 2, 'VaporTrail', 'API rate limit management agent that transparently throttles, queues, and retries outbound requests to stay within third-party API quotas.', '1.4.0', 35.0, 6.0, 1, 'Automation', 18760),

  -- DevOps (10 agents: 81-90)
  (81, 3, 'FluxOps', 'GitOps continuous delivery agent that syncs Kubernetes cluster state to Git branches. Supports multi-cluster environments with per-environment promotion gates.', '2.0.0', 89.0, 16.0, 1, 'DevOps', 9870),
  (82, 4, 'NodeStorm', 'Kubernetes node auto-scaling agent that combines predictive and reactive scaling based on workload forecasts and custom metrics.', '1.3.0', 79.0, 14.0, 0, 'DevOps', 7230),
  (83, 1, 'IronHelm', 'Helm chart management agent that tracks releases across clusters, detects drift, and auto-upgrades to latest stable chart versions with rollback safeguards.', '1.1.0', 69.0, 12.0, 1, 'DevOps', 8450),
  (84, 2, 'CipherMesh', 'Service mesh security agent for Istio and Linkerd. Automates mTLS certificate rotation, policy enforcement, and traffic observability configuration.', '1.4.0', 99.0, 17.0, 0, 'DevOps', 5670),
  (85, 3, 'NeonOps', 'All-in-one DevOps command center agent. Centralizes deployments, runbooks, incident response, and postmortems in a single conversational interface.', '2.1.0', 109.0, 19.0, 1, 'DevOps', 6320),
  (86, 4, 'PacketForge', 'Network policy automation agent for Kubernetes and cloud VPCs. Generates and enforces zero-trust micro-segmentation rules from service dependency graphs.', '1.0.0', 89.0, 15.0, 0, 'DevOps', 4120),
  (87, 1, 'ObsidianOps', 'Observability stack deployment agent that provisions and configures Prometheus, Grafana, Loki, and Tempo in under ten minutes with pre-built dashboards.', '1.2.0', 79.0, 14.0, 1, 'DevOps', 10980),
  (88, 2, 'TitanDrift', 'Infrastructure drift detection agent that continuously compares live cloud state against Terraform state files and raises PRs to reconcile divergences.', '1.5.0', 99.0, 18.0, 0, 'DevOps', 5430),
  (89, 3, 'SpectreRunner', 'Container image optimization agent that strips unnecessary layers, applies security hardening, and reduces final image size by up to 70%.', '1.0.0', 59.0, 10.0, 1, 'DevOps', 13560),
  (90, 4, 'VaultKeeper', 'Secrets management DevOps agent that integrates HashiCorp Vault with your CI/CD pipelines, injecting credentials at runtime without storing them in config files.', '2.2.0', 119.0, 21.0, 0, 'DevOps', 7890),

  -- Data (10 agents: 91-100)
  (91, 1, 'DataWeaver', 'Declarative data transformation agent that compiles dbt-style YAML models into optimized SQL for Snowflake, BigQuery, and DuckDB.', '2.0.0', 79.0, 14.0, 1, 'Data', 9230),
  (92, 2, 'NeonLake', 'Data lakehouse ingestion agent that onboards new sources, infers schemas, partitions data, and registers tables in Apache Iceberg or Delta Lake catalogs.', '1.3.0', 89.0, 16.0, 0, 'Data', 6780),
  (93, 3, 'PrismPipe', 'ELT pipeline builder agent that generates production-grade Airbyte or Fivetran configs from natural language source descriptions and sample data.', '1.1.0', 69.0, 12.0, 1, 'Data', 8450),
  (94, 4, 'QuantumSeed', 'Synthetic data generation agent that creates statistically faithful mock datasets for testing, demos, and ML training without privacy risk.', '1.4.0', 59.0, 10.0, 0, 'Data', 11230),
  (95, 1, 'NexusVault', 'Data catalog and governance agent that auto-classifies PII, enforces column-level access controls, and maintains searchable lineage across the data stack.', '2.1.0', 119.0, 21.0, 1, 'Data', 4560),
  (96, 2, 'CortexIngest', 'High-throughput data ingestion agent supporting CDC from Postgres, MySQL, and Oracle with exactly-once delivery to Kafka and cloud data warehouses.', '1.0.0', 99.0, 17.0, 0, 'Data', 7890),
  (97, 3, 'SignalMesh', 'Feature store agent that computes, versions, and serves ML features online and offline with point-in-time correctness for training and inference.', '1.2.0', 109.0, 19.0, 1, 'Data', 5120),
  (98, 4, 'GlassStream', 'Real-time data quality agent that validates every row against schema contracts as it flows through Kafka. Quarantines invalid records and alerts data owners.', '1.5.0', 69.0, 12.0, 0, 'Data', 8670),
  (99, 1, 'ZeroPoint ETL', 'Zero-config ETL agent that discovers APIs, databases, and file sources automatically and loads them into your warehouse with smart type inference.', '2.0.0', 49.0, 9.0, 1, 'Data', 14320),
  (100, 2, 'ArcaneSchema', 'Schema evolution agent that manages breaking changes across microservice contracts. Generates migration scripts and notifies downstream consumers automatically.', '1.1.0', 79.0, 14.0, 0, 'Data', 6340),

  -- NLP (4 agents: 101-104)
  (101, 3, 'SyntaxReaper', 'Code documentation agent that reads your entire codebase and generates contextually accurate docstrings, README sections, and API reference pages.', '1.3.0', 49.0, 9.0, 1, 'NLP', 19870),
  (102, 4, 'PhantomParser', 'Unstructured document parsing agent that extracts structured data from PDFs, invoices, contracts, and scanned forms with 97%+ field accuracy.', '2.0.0', 59.0, 10.0, 0, 'NLP', 12340),
  (103, 1, 'LexiForge', 'Domain-specific language model fine-tuning agent. Adapts foundation models to your proprietary corpus using LoRA adapters and exports GGUF for local inference.', '1.1.0', 99.0, 17.0, 1, 'NLP', 5670),
  (104, 2, 'EchoSentinel', 'Real-time content moderation NLP agent that classifies toxic, harmful, and off-brand language across chat, reviews, and social feeds at 10K msgs/sec.', '1.4.0', 89.0, 15.0, 0, 'NLP', 8920),

  -- Vision (3 agents: 105-107)
  (105, 3, 'RetinalScan', 'Medical imaging analysis agent for radiology workflows. Detects anomalies in X-ray, MRI, and CT scans and generates structured DICOM-compatible reports.', '2.1.0', 149.0, 25.0, 0, 'Vision', 2340),
  (106, 4, 'NeonDepth', 'Monocular depth estimation agent for AR and robotics applications. Processes 60 FPS video streams and outputs per-pixel depth maps in real time.', '1.2.0', 79.0, 14.0, 1, 'Vision', 4560),
  (107, 1, 'ChromaCast', 'Video analytics agent that tracks objects, counts footfall, and measures dwell time from RTSP camera streams without storing raw footage.', '1.5.0', 99.0, 18.0, 0, 'Vision', 6780),

  -- Security (3 agents: 108-110)
  (108, 2, 'PhantomTrace', 'Digital forensics agent that reconstructs attack timelines from system logs, memory dumps, and network captures. Produces court-ready incident reports.', '1.3.0', 129.0, 22.0, 1, 'Security', 3450),
  (109, 3, 'IronVeil', 'Zero-trust network access agent that evaluates device posture, user identity, and context signals before granting fine-grained application access.', '2.0.0', 119.0, 21.0, 0, 'Security', 4120),
  (110, 4, 'NeuralShield', 'Adversarial ML attack detection agent that monitors model inference endpoints for prompt injection, data poisoning, and model inversion attempts.', '1.1.0', 99.0, 17.0, 1, 'Security', 5670);

-- Purchases for qnguyen (user 5)
INSERT OR IGNORE INTO purchases (user_id, agent_id, type) VALUES
  (5, 1, 'buy'),
  (5, 3, 'rent');

-- Favorites for qnguyen (user 5)
INSERT OR IGNORE INTO user_favorites (user_id, agent_id) VALUES
  (5, 2),
  (5, 5),
  (5, 8),
  (5, 10);
