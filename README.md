# KP ETSIP

**Enterprise Technology Standards & Innovation Platform**

A comprehensive, fully client-side single-page application for managing enterprise technology standards, portfolios, applications, governance, quality gates, technical debt, integrations, and AI-powered insights. All data is stored in `localStorage` with deterministic seed data generation — no backend required.

---

## Tech Stack

- **Framework:** React 18 with Vite
- **Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS 3
- **Charts:** Recharts
- **Routing:** React Router v6 (createBrowserRouter)
- **Storage:** localStorage (no backend, no database)
- **Export:** SheetJS (XLSX), CSV, JSON, PDF (print)
- **IDs:** UUID + human-readable prefixed IDs (PF-001, APP-042, etc.)
- **Testing:** Vitest + React Testing Library
- **Deployment:** Vercel (static SPA)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the application at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Produces a production build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm test
```

### Lint

```bash
npm run lint
```

---

## Folder Structure

```
kp-etsip-spa/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── vitest.config.js              # Vitest test configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── vercel.json                   # Vercel deployment rewrites
├── src/
│   ├── main.jsx                  # React DOM entry point
│   ├── App.jsx                   # Root component with providers and boot sequence
│   ├── router.jsx                # React Router v6 route definitions
│   ├── index.css                 # Tailwind directives and global styles
│   ├── components/
│   │   ├── admin/                # Administration panel components
│   │   │   ├── AuditLogPanel.jsx
│   │   │   ├── DataControlsPanel.jsx
│   │   │   ├── FeatureFlagPanel.jsx
│   │   │   └── PlatformHealthPanel.jsx
│   │   ├── auth/
│   │   │   └── SSOSplash.jsx     # Simulated SSO login splash screen
│   │   ├── common/               # Reusable UI components
│   │   │   ├── ChartWrapper.jsx  # Accessible Recharts wrapper
│   │   │   ├── ConfirmDialog.jsx # Confirmation dialog for destructive actions
│   │   │   ├── DataTable.jsx     # Data table with search, sort, filter, pagination, export
│   │   │   ├── EmptyState.jsx    # Empty state placeholder
│   │   │   ├── FormField.jsx     # Accessible form field component
│   │   │   ├── LoadingSpinner.jsx# Loading spinner with ARIA live region
│   │   │   ├── Modal.jsx         # Accessible modal dialog with focus trap
│   │   │   ├── PermissionDenied.jsx # Permission denied state
│   │   │   ├── PermissionGate.jsx# Permission-gated rendering
│   │   │   ├── ScoreCard.jsx     # KPI/score display card
│   │   │   └── StatusBadge.jsx   # Colored status indicator badge
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx     # Main layout with TopBar, Sidebar, content area
│   │   │   ├── Sidebar.jsx       # Persona-specific sidebar navigation
│   │   │   └── TopBar.jsx        # Top bar with role switcher, theme toggle, notifications
│   │   └── notifications/
│   │       └── NotificationCenter.jsx # Notification dropdown panel
│   ├── constants/
│   │   ├── constants.js          # Storage keys, ID prefixes, score bands, seed sizes
│   │   ├── entitySchemas.js      # Complete schema definitions for all 24 entity types
│   │   ├── navigationConfig.js   # Navigation items, groups, access level filtering
│   │   ├── permissionMatrix.js   # Access level × entity type × action permission matrix
│   │   └── personas.js           # 22 persona definitions with access levels and nav sections
│   ├── contexts/
│   │   ├── FeatureFlagContext.jsx # Feature flag state and toggle actions
│   │   ├── NotificationContext.jsx# Notification state, mark as read, refresh
│   │   ├── PersonaContext.jsx    # Active persona, permissions, navigation
│   │   └── ThemeContext.jsx      # Light/dark theme with per-persona persistence
│   ├── hooks/
│   │   ├── useEntityList.js      # Entity list state management (search, filter, sort, paginate)
│   │   ├── useMetrics.js         # Metrics computation hook
│   │   └── usePermission.js      # Permission check hook
│   ├── pages/
│   │   ├── AIInsightsPage.jsx    # AI insights with Ask KP ETSIP and 13 feature analyses
│   │   ├── AdministrationPage.jsx# Admin page with data controls, feature flags, audit log, health
│   │   ├── DashboardPage.jsx     # Role-specific dashboard with KPIs and charts
│   │   ├── EntityCreatePage.jsx  # Generic entity creation page
│   │   ├── EntityDetailPage.jsx  # Generic entity detail/edit page with related entities
│   │   ├── EntityListPage.jsx    # Generic entity list page with DataTable
│   │   ├── IntegrationsPage.jsx  # Integration cards with test connection and sync
│   │   ├── NotificationsPage.jsx # Full notification management page
│   │   └── SchedulerPage.jsx     # Schedule management with Run Now simulation
│   ├── seed/
│   │   ├── seedEngine.js         # Deterministic seed data generator using seeded PRNG
│   │   └── templatePools.js      # Curated text pools for realistic data generation
│   ├── services/
│   │   ├── adminDataService.js   # Reseed, reset, export, import, clear data operations
│   │   ├── aiInsightRepository.js# AI insight CRUD repository
│   │   ├── aiInsightService.js   # 13 AI feature generators + Ask KP ETSIP NL search
│   │   ├── auditLogService.js    # Structured audit log with filtering and pagination
│   │   ├── entityRepository.js   # Generic CRUD with referential integrity enforcement
│   │   ├── featureFlagService.js # Feature flag management (aiPanels, darkMode, etc.)
│   │   ├── integrationRepository.js # Integration CRUD repository
│   │   ├── integrationService.js # Simulated test connection and sync operations
│   │   ├── metricsEngine.js      # On-demand metrics computation from localStorage
│   │   ├── navigationService.js  # Persona-filtered navigation resolution
│   │   ├── notificationRepository.js # Notification CRUD repository
│   │   ├── notificationService.js# Notification routing, simulated email/Teams delivery
│   │   ├── permissionService.js  # Permission checking against the permission matrix
│   │   ├── personaManager.js     # Active persona management and switching
│   │   ├── platformHealthService.js # Platform health monitoring and warnings
│   │   └── schedulerService.js   # Schedule CRUD with simulated Run Now execution
│   ├── storage/
│   │   ├── schemaMigration.js    # Schema version migration framework
│   │   └── storageAdapter.js     # localStorage abstraction with quota handling
│   └── utils/
│       ├── dateUtils.js          # Date formatting, parsing, arithmetic
│       ├── exportUtils.js        # CSV, JSON, XLSX, PDF export with stub file generation
│       ├── idGenerator.js        # Human-readable ID generation (PF-001, APP-042)
│       ├── prng.js               # Deterministic seeded PRNG (mulberry32)
│       └── validators.js         # Entity validation, referential integrity checks
```

---

## Features

### 22 Persona-Based Role Switching

Switch between 22 enterprise personas in real time via the TopBar role switcher. Each persona has a unique access level, navigation sections, data scope, and landing page:

- **Executive Leadership** — Executive-level dashboards and approvals
- **VP ETS** — Strategic oversight with waiver and integration access
- **Executive Director ETS** — Strategic planning and governance
- **Sr Director / Director ETS Portfolio Leader** — Portfolio management
- **Quality Engineer** — Quality gates, evidence, use cases
- **Automation Engineer / SDET / Developer** — Engineering-focused views
- **Product Owner / Scrum Master QE Manager** — Team management
- **Release Manager** — Release and deployment workflows
- **Program Manager / Application Owner** — Portfolio and application ownership
- **Environment Manager** — Environment configuration and health
- **Test Data / Performance / Security / Accessibility Engineer** — Specialized engineering
- **Production Support (Read Only)** — Read-only monitoring
- **Vendor Partner** — External limited access
- **Platform Administrator** — Full admin access to all features

### 20+ Entity Types with Full CRUD

All entities support create, read, update, delete with:

- Human-readable IDs (PF-001, APP-042, TS-015)
- Referential integrity enforcement (CASCADE, BLOCK, SET_NULL)
- Schema validation with field-level constraints
- Audit logging for all mutations
- Permission-gated operations per persona

**Entity types:** Portfolio, Application, Relationship, Technology Category, Technology Standard, Technology Entry, Definition, Environment, Technical Debt, Quality Gate, Governance Record, Approval Request, Waiver, Evidence, User, Role, Integration, Notification, AI Analysis, PDE Configuration, Demo Scenario, Schedule, Audit Log, Use Case.

### Simulated AI Insights (13 Feature Types)

All AI output is generated locally from seeded data and labeled as **"AI (simulated)"**:

- Tech Radar Analysis
- Lifecycle Prediction
- Risk Assessment
- Dependency Analysis
- Migration Planning
- Cost Optimization
- Compliance Check
- Anomaly Detection
- Trend Forecasting
- Portfolio Optimization
- Standard Recommendation
- Debt Prioritization
- Impact Analysis

**Ask KP ETSIP** — Natural language search that matches queries against an intent library and returns data-derived answers.

### Simulated Integrations (22 Types)

Integration cards with simulated **Test Connection** and **Sync Now** operations:

REST API, GraphQL, Webhook, LDAP, SAML, OAuth2, OIDC, Jira, ServiceNow, Confluence, GitHub, GitLab, Azure DevOps, Jenkins, SonarQube, Snyk, Splunk, Datadog, Elastic, Slack, Teams, Email.

### Notification System

- Persona-routed notifications with 14 trigger types
- Read/unread state management
- Simulated Email and Microsoft Teams delivery previews (labeled **"sent (simulated)"**)
- Filter by trigger, type, priority, read state

### Dashboard with Real-Time Metrics

- Role-specific KPI ScoreCards with trend indicators and score bands
- Compliance, quality gate, tech debt, and standard adoption trend charts
- Risk distribution pie chart
- Environment and integration health summaries
- All metrics computed on demand from localStorage data

### Administration

- **Data Controls:** Reseed, reset to defaults, export all (JSON), import, clear all data
- **Feature Flags:** Toggle AI panels, dark mode, simulated latency, verbose logging
- **Audit Log:** Searchable, filterable, paginated audit trail of all platform actions
- **Platform Health:** localStorage usage bar, integration health, error counts, warnings

### Scheduler

- Create, edit, pause, resume, delete schedules
- **Run Now** triggers simulated execution with deterministic test results
- Generates notifications on execution completion

### Deterministic Seed Data

- Seeded PRNG (mulberry32) ensures identical data for the same seed value
- Three seed sizes: Small (~50 records), Standard (~200 records), Large (~500 records)
- 12-point monthly trend series embedded in entity metadata
- Realistic names, descriptions, and relationships from curated template pools

### Accessibility

- ARIA landmarks, roles, and labels throughout
- Keyboard navigation with focus trapping in modals
- Skip-to-content link
- Screen reader announcements for loading states
- Accessible chart table toggle alternative
- Focus-visible outlines

### Export Capabilities

- CSV, JSON, XLSX (SheetJS), PDF (browser print)
- PowerPoint and Power BI stub file generation
- Permission-gated export buttons per entity type

---

## Data Storage

All application data is stored in the browser's `localStorage`. No backend server, database, or network requests are required. The application is fully self-contained.

**Storage keys** are namespaced with the `kp_etsip_` prefix. The estimated localStorage quota is 5MB. The Administration page displays real-time storage usage with warnings at 80% and critical alerts at 90%.

**Schema versioning** is tracked in localStorage. The migration framework supports future schema upgrades with automatic backup before migration.

---

## Deployment

### Vercel (Recommended)

The project includes a `vercel.json` with SPA rewrites configured. Deploy by connecting the repository to Vercel:

1. Push the repository to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Vercel auto-detects Vite and configures the build
4. All routes are rewritten to `index.html` for client-side routing

### Static Hosting

Build the project and serve the `dist/` directory from any static file server:

```bash
npm run build
```

Ensure all routes are rewritten to `index.html` for client-side routing support.

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `aiPanels` | Enabled | AI-powered insight panels and recommendations |
| `darkMode` | Disabled | Dark mode theme toggle support |
| `simulatedLatency` | Enabled | Simulated network latency for async operations |
| `verboseConsoleLogging` | Disabled | Verbose console logging for debugging |

Feature flags can be toggled from the Administration page (Feature Flags tab) by the Platform Administrator persona.

---

## Permission Matrix

The permission system uses an 8-level access hierarchy mapped against 24 entity types and 10 action types:

**Access Levels:** Admin, Executive, Strategic, Management, Operational, Contributor, Read Only, External

**Actions:** View, Create, Edit, Delete, Approve, Waive, Export, Configure, Execute, Administer

Each persona's access level determines which actions they can perform on which entity types. The `PermissionGate` component and `usePermission` hook enforce these permissions throughout the UI.

---

## Environment Variables

No environment variables are required. The application runs entirely in the browser with no external API calls.

If needed for future extensions, Vite environment variables use the `VITE_` prefix and are accessed via `import.meta.env.VITE_*`.

---

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires `localStorage` to be enabled.

---

## License

Private