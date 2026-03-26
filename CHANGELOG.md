# DMS Insight - Changelog

All notable changes to DMS Insight will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.5.0-DMS] - 2026-03-09

### Added
- **Feature Flags System**: Master Admin can enable/disable specific features per company
  - 18 feature flags across 4 modules
  - 3 workflow variants with configurable options
  - Frontend `hasFeature()` hook for conditional rendering
  
- **AI Demo Company Generator**: Create realistic demo companies using natural language
  - GPT-4o powered prompt parsing
  - Generates complete data: company, users, sites, assets, test records
  - 5 preset example prompts
  
- **Company Factory Reset**: Clear all operational data while preserving users
  - Safety confirmation (type company name)
  - Audit logging of reset actions
  
- **Dynamic Region Risk Heatmap**: Compass-style grid layout for regions
  - Supports 1-9 regions in intelligent layout
  - Auto-detects region names for positioning
  
- **Version Tracking System**: Track deployed versions across instances
  - VERSION.json configuration
  - API endpoint for version info
  - Footer version display

### Changed
- Region Risk Heatmap now dynamically adapts to any number of regions
- Company Management page now has 4 action buttons per company

### Fixed
- GridTech seed script duplicate site names issue
- Export/Import cross-tenant ID mapping
- Region names not displaying correctly in exports

---

## [2.4.0-DMS] - 2026-03-05

### Added
- Complete Company Export/Import with all modules
- Cross-module linking between Online Monitoring and Asset Performance
- Test Records bulk export with asset mapping

### Fixed
- Import failing when sites/assets present without company
- Duplicate equipment imports on re-import

---

## [2.3.0-DMS] - 2026-03-01

### Added
- Online Monitoring Dashboard with real-time widgets
- Substation Heatmap Widget
- Mini bar charts in Region Risk Overview
- Data Import/Export for Monitoring Module

### Changed
- Improved dashboard layout and responsiveness

---

## [2.2.0-DMS] - 2026-02-26

### Added
- Audit Testing Feature for Production Module
- Third-party audit workflow support
- Audit test result recording

---

## [2.1.0-DMS] - 2026-02-20

### Added
- Production Testing Module MVP
- Product and Test Specification management
- Test execution workflow
- Operator and Supervisor roles

---

## [2.0.0-DMS] - 2026-02-15

### Added
- Multi-tenant architecture
- Company Management for Master Admin
- Module-based access control
- Online Monitoring Module MVP

### Changed
- Complete UI redesign with Shadcn components
- New navigation structure

---

## [1.0.0-DMS] - 2026-01-15

### Added
- Initial release of DMS Insight
- Asset Performance Module
- Site and Asset Management
- Test Records tracking
- User authentication and authorization
- Basic reporting

---

## Version Naming Convention

```
v{MAJOR}.{MINOR}.{PATCH}-{CUSTOMER_CODE}

Examples:
- v2.5.0-DMS   → DMS Insight SaaS (main instance)
- v2.5.0-TC    → Torrent Cables (on-premise)
- v2.5.0-GE    → GridTech Energy (on-premise)
```

### Customer Codes
| Code | Customer | Deployment |
|------|----------|------------|
| DMS | DMS Insight | SaaS (Cloud) |
| TC | Torrent Cables | On-Premise |
| GE | GridTech Energy | On-Premise |

---

## Upgrade Notes

### Upgrading to 2.5.0
- No database migration required
- Feature flags will use defaults until configured
- Existing workflows continue to work as "standard"

### Upgrading to 2.4.0
- Run database migration for cross_module_links collection
- Re-export any existing data to include new fields
