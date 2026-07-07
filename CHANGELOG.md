# Changelog

All notable changes to the KP ETSIP (Enterprise Technology Standards & Innovation Platform) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added

#### Role-Based Dashboards
- 22 persona-based role switching via TopBar role switcher with real-time navigation updates.
- Persona-specific dashboard views with KPI ScoreCards, trend charts, and summary tables.
- Access level hierarchy: Admin, Executive, Strategic, Management, Operational, Contributor, Read Only, External.
- Per-persona landing pages, navigation sections, and data scope filtering.

#### Entity CRUD (20+ Entity Types)
- Full create, read, update, delete operations for all entity types:
  Portfolio, Application, Relationship, Technology Category, Technology Standard,
  Technology Entry, Definition, Environment, Technical Debt, Quality Gate,
  Governance Record, Approval Request, Waiver, Evidence, User, Role,
  Integration, Notification, AI Analysis, PDE Configuration, Demo Scenario,
  Schedule, Audit Log, Use Case.
- Human-readable ID generation with prefixed sequences (PF-001, APP-042, TS-015).
- Referential integrity enforcement with CASCADE, BLOCK, and SET_NULL delete actions.
- Schema validation with field-level constraints (required, min/max, enum, unique, pattern).
- Generic EntityListPage, EntityDetailPage, and EntityCreatePage components.
- DataTable component with search, sort, filter, pagination, column visibility, and export.

#### Simulated RBAC (Permission System)
- 8-level access hierarchy mapped against 24 entity types and 10 action types.
- Permission matrix defining view, create, edit, delete, approve, waive, export, configure, execute, administer actions.
- PermissionGate component for conditional rendering based on permissions.
- usePermission hook for programmatic permission checks.
- PermissionDenied component with audit logging of denied access attempts.

#### Integrations (22 Types)
- Integration cards for REST API, GraphQL, Webhook, LDAP, SAML, OAuth2, OIDC, Jira, ServiceNow, Confluence, GitHub, GitLab, Azure DevOps, Jenkins, SonarQube, Snyk, Splunk, Datadog, Elastic, Slack, Teams, Email.
- Simulated Test Connection with deterministic status updates and latency simulation.
- Simulated Sync Now with deterministic sync results, error counts, and health score updates.
- Bulk test and bulk sync operations.
- Integration health summary with status distribution and average health score.

#### Notification System
- 14 notification trigger types covering standards, waivers, approvals, tech debt, quality gates, governance, AI, and integrations.
- Persona-routed notifications with read/unread state management.
- NotificationCenter dropdown panel with filtering by trigger, type, priority, and read state.
- Full NotificationsPage with search, pagination, and detail modal.
- Simulated Email delivery preview with HTML body generation, labeled "sent (simulated)".
- Simulated Microsoft Teams delivery preview with MessageCard format, labeled "sent (simulated)".
- Multi-channel notification simulation (InApp + Email + Teams).

#### AI Insights (13 Feature Types)
- Tech Radar Analysis with standard status distribution and adoption rate metrics.
- Lifecycle Prediction with application transition forecasting.
- Risk Assessment with aggregated risk scores from applications, tech debt, and quality gates.
- Dependency Analysis with relationship mapping and critical dependency identification.
- Migration Planning with non-compliant entry counts and estimated migration effort.
- Cost Optimization with tech debt cost analysis and savings potential.
- Compliance Check with compliance rate, waiver counts, and tech entry status.
- Anomaly Detection with deterministic anomaly generation.
- Trend Forecasting with compliance trajectory prediction.
- Portfolio Optimization with per-portfolio compliance scoring.
- Standard Recommendation with emerging standard identification and low-adoption analysis.
- Debt Prioritization with priority-sorted open debt items and cost estimates.
- Impact Analysis with dependency and technology entry impact scoring.
- Ask KP ETSIP natural language search with intent library matching 12+ query patterns.
- All AI output labeled as "AI (simulated)" with deterministic generation from seeded data.

#### Metrics Engine
- On-demand metrics computation from localStorage data for all entity types.
- Dashboard-level aggregated KPIs: overall health score, compliance score, quality gate pass rate, tech debt resolution rate, standard adoption rate, environment health rate, integration health.
- Entity-level metrics for Portfolio, Application, Tech Standard, Tech Debt, Quality Gate, Governance Record, Approval Request, Waiver, Environment, Integration, Notification, AI Analysis, Evidence, Relationship, Use Case, Tech Entry.
- Scope filtering by portfolioId and applicationId.
- 12-point monthly trend series computation from entity metadata with aggregation.
- Trend types: compliance, risk, techDebt, qualityGates, standardAdoption, integrationHealth, environmentHealth, techEntryCompliance.
- Score band classification: Critical (0-20), Poor (21-40), Fair (41-60), Good (61-80), Excellent (81-100).

#### Administration Controls
- Data Controls: Reseed database with configurable seed size (Small ~50, Standard ~200, Large ~500 records).
- Data Controls: Reset to factory defaults with standard seed.
- Data Controls: Export all data as JSON with metadata, entity counts, and storage usage.
- Data Controls: Import data from JSON with validation, duplicate ID detection, and schema version checking.
- Data Controls: Clear all data from localStorage with confirmation dialog.
- Data Controls: Seed size selector with persistence.
- Feature Flags: Toggle AI Panels, Dark Mode, Simulated Latency, Verbose Console Logging.
- Feature Flags: Reset to defaults with audit logging.
- Feature Flags: Category-based grouping (features, theming, demo, development).
- Audit Log: Searchable, filterable, paginated audit trail of all platform actions.
- Audit Log: Filter by action, entity type, status, date range.
- Platform Health: localStorage usage bar with warning at 80% and critical at 90%.
- Platform Health: Integration health summary table.
- Platform Health: Error counts by category (integrations, quality gates, critical debt, expired waivers, failed AI, degraded environments).
- Platform Health: Seed and schema information display.
- Platform Health: Active warnings section with actionable messages.
- All administration actions permission-gated to Platform Administrator persona.
- All administration actions audit-logged with userId, userName, timestamp, and details.

#### Theming
- Light mode as default theme.
- Dark mode support gated by darkMode feature flag.
- Per-persona theme preference persistence in localStorage.
- Tailwind CSS dark: prefix support throughout all components.
- Theme toggle in TopBar (visible only when darkMode feature flag is enabled).

#### Platform Health Monitoring
- Real-time localStorage usage computation with bytes, percentage, and per-key breakdown.
- Integration health aggregation with status distribution and average health score.
- Error count computation across integrations, quality gates, tech debt, waivers, AI analyses, and environments.
- Warning flag system: storage approaching limit, storage critical, high error count, schema version mismatch, not seeded, integrations unhealthy.
- Overall status determination: healthy, warning, or critical.
- Health change listener registration with unsubscribe support.
- Human-readable health summary string generation.

#### Accessibility
- ARIA landmarks (banner, navigation, main, region, status, alert, dialog) throughout all components.
- ARIA roles (table, row, columnheader, cell, tablist, tab, tabpanel, listbox, option, switch, menuitem, progressbar, figure) on interactive elements.
- aria-label, aria-labelledby, aria-describedby, aria-sort, aria-expanded, aria-selected, aria-checked, aria-pressed, aria-current, aria-haspopup, aria-controls, aria-live, aria-atomic, aria-modal, aria-invalid, aria-required attributes.
- Skip-to-content link in AppLayout.
- Keyboard navigation with focus trapping in Modal component.
- Focus-visible outlines on all interactive elements.
- Screen reader announcements for loading states via ARIA live regions.
- Accessible chart table toggle alternative in ChartWrapper.
- Sortable column headers with keyboard Enter/Space support.

#### Deterministic Seed Data
- Seeded PRNG (mulberry32) ensuring identical data for the same seed value.
- Three seed sizes: Small (~50 records), Standard (~200 records), Large (~500 records).
- 12-point monthly trend series embedded in entity metadata.
- Curated template pools for realistic names, descriptions, and relationships.
- Referential integrity maintained across all seeded entities.
- Portfolio application counts synchronized with actual application records.
- Role user counts synchronized with actual user records.
- ID counters synchronized with seeded record counts.

#### Export Capabilities
- CSV export with proper field escaping and header generation.
- JSON export with pretty-printed formatting.
- XLSX export using SheetJS with automatic worksheet creation.
- PDF export via browser print dialog.
- PowerPoint stub file generation with metadata and instructions.
- Power BI stub file generation with metadata and instructions.
- Permission-gated export buttons per entity type.

#### Scheduler
- Schedule CRUD with type (review, assessment, sync, report, maintenance, audit) and frequency (once, daily, weekly, biweekly, monthly, quarterly, annually).
- Pause, resume, and cancel schedule operations.
- Run Now simulated execution with deterministic test results (pass/fail, duration, test counts).
- Automatic nextRunDate computation based on frequency.
- Notification generation on execution completion.
- Schedule summary with upcoming count (within 7 days).

#### Schema Migration Framework
- Schema version tracking in localStorage.
- Automatic migration check during application boot.
- Backup creation before migration.
- Data sanitization for corrupted storage entries.
- Semver comparison for version ordering.
- Downgrade detection with version reset.

#### UI Components
- AppLayout with TopBar, Sidebar, and main content area.
- TopBar with role switcher, theme toggle, notification bell, and user display.
- Sidebar with persona-specific navigation, collapsible groups, and mobile responsive overlay.
- ChartWrapper with Recharts (bar, line, pie, area) and accessible table toggle.
- DataTable with search, sort, filter, pagination, column visibility, and export.
- ScoreCard with trend indicators, score bands, and ARIA live regions.
- StatusBadge with variant-based coloring (success, warning, danger, info, neutral).
- Modal with focus trap, escape-to-close, and overlay backdrop.
- ConfirmDialog for destructive actions with danger/warning variants.
- FormField supporting text, textarea, select, date, number, checkbox, email, url, password types.
- EmptyState with icon, title, message, and action button.
- LoadingSpinner with ARIA live region and size variants.
- PermissionGate for conditional rendering.
- PermissionDenied with persona info and audit logging.
- NotificationCenter dropdown panel.
- SSOSplash simulated login screen with auto-dismiss.

#### Storage
- localStorage abstraction with JSON serialization/deserialization.
- Quota exceeded error handling with user-friendly messages.
- Storage usage computation with per-key breakdown.
- Namespaced keys with kp_etsip_ prefix.
- Import/export with overwrite and clearFirst options.

#### Routing
- React Router v6 with createBrowserRouter.
- Routes for all entity types with list, create, and detail views.
- Specialized pages: Dashboard, AI Insights, Administration, Integrations, Notifications, Scheduler.
- Catch-all 404 page.
- Vercel SPA rewrites configuration.

#### Testing
- Vitest + React Testing Library test suite.
- Unit tests for storageAdapter, seedEngine, entityRepository, adminDataService, permissionService, metricsEngine, aiInsightService, integrationService, notificationService.
- Component tests for DataTable, TopBar, AdministrationPage.
- Mock utilities for exportUtils to prevent file downloads during tests.

### Technical Details

- **Framework:** React 18 with Vite 5
- **Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS 3 with custom design tokens
- **Charts:** Recharts 2
- **Routing:** React Router v6 (createBrowserRouter)
- **Storage:** localStorage (no backend, no database)
- **Export:** SheetJS (XLSX), CSV, JSON, PDF (print)
- **IDs:** Deterministic seeded PRNG + human-readable prefixed IDs
- **Testing:** Vitest 2 + React Testing Library 16
- **Deployment:** Vercel (static SPA)