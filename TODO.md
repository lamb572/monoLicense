# MonoLicense - Documentation TODO

This document tracks all documentation and planning tasks that must be completed **before any code is written**.

## Status Legend
- ⬜ Not started
- 🟡 In progress
- ✅ Complete
- 🔄 Needs review/update

---

## Phase 1: Foundation Documents

### ✅ PROJECT_OVERVIEW.md
**Purpose**: High-level vision, problem statement, and solution overview
**Key sections**:
- Working title and tagline
- Problem statement
- Target users
- Core value proposition
- MVP feature set
- Non-goals for v1
- Pricing strategy (rough)
- Immediate next steps

**Status**: Complete
**Updates needed**: Add `init` command to feature set and immediate next steps
**Dependencies**: None (start here)
**Estimated effort**: 1-2 hours

---

### ✅ ARCHITECTURE.md
**Purpose**: Complete system design and component relationships
**Key sections**:
- System overview diagram
- Core components (CLI, Scanner, Config Parser, Reporter, Policy Engine)
- Data flow diagrams
- Technology stack decisions
- Monorepo detection strategy
- Lockfile parsing approach
- Dependency graph construction
- External dependencies

**Status**: Complete
**Updates needed**:
- Add `init` command to CLI component
- Add License Recommendation Engine component
- Add `update-license-data` command
- Update Technology Stack (@clack/prompts, license data API)
- Add data flow for init process
**Dependencies**: PROJECT_OVERVIEW.md
**Estimated effort**: 3-4 hours

---

### ⬜ CODING_STANDARDS.md
**Purpose**: Language conventions, patterns, and file structure rules
**Key sections**:
- TypeScript configuration and strict mode rules
- Naming conventions (files, functions, classes, variables)
- File and folder structure standards
- Import/export patterns
- Error handling patterns
- Comment and documentation standards
- Code formatting (Prettier/ESLint config)
- Async/await patterns
- No-nos and anti-patterns

**Dependencies**: ARCHITECTURE.md
**Estimated effort**: 2-3 hours

---

### 🟡 CONFIG_SCHEMA.md
**Purpose**: Exact specification of monolicense config file format
**Key sections**:
- File format (JSON/YAML/both?)
- Complete schema with all fields
- Field descriptions and validation rules
- Example configurations (simple, medium, complex)
- Default values and optional fields
- Project/workspace definition syntax
- Policy definition syntax (allowed, review, forbidden)
- Auto-approve patterns
- Override and inheritance rules
- Updates configuration (license data check frequency)

**Status**: In progress
**Dependencies**: ARCHITECTURE.md
**Estimated effort**: 2-3 hours

---

## Phase 2: Technical Specifications

### ⬜ TECHNICAL_SPEC.md
**Purpose**: Detailed component behaviors and algorithms
**Key sections**:
- Monorepo detection algorithm
- Lockfile parsing logic per package manager
- Dependency resolution algorithm
- License extraction and normalization
- License recommendation system (tier logic, metadata)
- License data update mechanism
- License data API specification
- Policy evaluation logic
- Report generation process
- Caching strategy
- Performance optimization approaches

**Dependencies**: ARCHITECTURE.md, CONFIG_SCHEMA.md
**Estimated effort**: 5-6 hours (increased due to license recommendation system)

---

### ⬜ API_SPECIFICATION.md
**Purpose**: CLI interface definition
**Key sections**:
- All CLI commands with descriptions:
  - `monolicense scan`
  - `monolicense init` (interactive setup wizard)
  - `monolicense approve` (v1.5+)
  - `monolicense diff` (v1.5+)
  - `monolicense update-license-data`
  - `monolicense check-license-data`
  - `monolicense validate`
  - `monolicense version`
- Command flags and arguments
- Interactive mode vs non-interactive mode
- CI/CD usage patterns
- Exit codes and their meanings
- Output format specifications (JSON, Markdown, HTML)
- Environment variables
- Configuration file resolution order
- Example command usage for all scenarios

**Dependencies**: TECHNICAL_SPEC.md
**Estimated effort**: 3-4 hours (increased due to init and interactive modes)

---

### ⬜ DATA_MODELS.md
**Purpose**: Internal data structures and types
**Key sections**:
- TypeScript interfaces for all core entities
  - Project/Workspace
  - Dependency
  - License
  - LicenseRecommendation (new)
  - LicenseMetadata (new)
  - PolicyRule
  - ScanResult
  - Violation
  - Approval
- License recommendation data structure
- Lockfile format representations (pnpm, npm, yarn, Rush)
- Internal graph structure
- Serialization formats
- License data API response types

**Dependencies**: TECHNICAL_SPEC.md
**Estimated effort**: 3-4 hours (increased due to license recommendation types)

---

## Phase 3: Process & Quality

### ⬜ TESTING_STRATEGY.md
**Purpose**: Test coverage requirements and approach
**Key sections**:
- Test coverage requirements (unit, integration, e2e)
- Testing framework choices (Jest, Vitest, etc.)
- Fixture strategy for lockfiles and monorepos
- Mock strategy for file system operations
- CI test automation requirements
- Performance benchmarking tests
- Snapshot testing for reports
- Test file naming and organization

**Dependencies**: ARCHITECTURE.md, TECHNICAL_SPEC.md
**Estimated effort**: 2-3 hours

---

### ⬜ DEVELOPMENT_WORKFLOW.md
**Purpose**: Git workflow, PR process, and collaboration rules
**Key sections**:
- Branch naming conventions
- Commit message format
- PR requirements (tests, docs, review)
- Code review checklist
- Definition of done
- Release process
- Versioning strategy (SemVer)
- Changelog management

**Dependencies**: CODING_STANDARDS.md, TESTING_STRATEGY.md
**Estimated effort**: 1-2 hours

---

### ⬜ ROADMAP.md
**Purpose**: Phased feature rollout with clear milestones
**Key sections**:
- v0.1 - Proof of concept (pnpm only, basic scan)
- v0.5 - MVP CLI (multi-package-manager, policy checks)
- v1.0 - Production ready:
  - `init` command with license recommendations
  - GitHub Action
  - File-based approvals
  - Auto-approve patterns
  - Baseline scan storage
- v1.5 - Enhanced UX:
  - GitHub Bot with interactive approvals
  - `diff` command
  - `approve` CLI helper
  - HTML reports
  - Persistent caching
- v2.0 - Advanced features:
  - Hosted service with MongoDB
  - Web dashboard
  - Version update detection
  - Migration tools
- Feature matrix by version
- Known limitations by version

**Dependencies**: PROJECT_OVERVIEW.md, TECHNICAL_SPEC.md
**Estimated effort**: 2-3 hours

---

## Phase 4: Operational Docs

### ⬜ CONTRIBUTING.md
**Purpose**: Guide for external contributors
**Key sections**:
- How to set up dev environment
- How to run tests
- How to submit PRs
- Code of conduct reference
- Communication channels
- Recognition for contributors

**Dependencies**: DEVELOPMENT_WORKFLOW.md, TESTING_STRATEGY.md
**Estimated effort**: 1-2 hours

---

### ⬜ ERROR_HANDLING.md
**Purpose**: Error taxonomy and handling strategy
**Key sections**:
- Error code system
- Error categories (config, scan, policy, io, etc.)
- Error message templates
- User-facing error messages
- Debug mode output
- Recovery strategies
- Logging approach

**Dependencies**: TECHNICAL_SPEC.md, API_SPECIFICATION.md
**Estimated effort**: 2-3 hours

---

### ⬜ PERFORMANCE_REQUIREMENTS.md
**Purpose**: Speed benchmarks and resource limits
**Key sections**:
- Target scan times for different repo sizes
- Memory usage limits
- Acceptable lockfile sizes
- Parallelization strategy
- Progress indicators for long scans
- Benchmarking methodology

**Dependencies**: TECHNICAL_SPEC.md
**Estimated effort**: 1-2 hours

---

## Phase 5: Additional Documentation (As Needed)

### ⬜ SECURITY.md
**Purpose**: Security considerations and responsible disclosure
**Dependencies**: ARCHITECTURE.md
**Estimated effort**: 1 hour

---

### ⬜ PACKAGE_MANAGER_SUPPORT.md
**Purpose**: Detailed notes on each package manager's lockfile format
**Dependencies**: TECHNICAL_SPEC.md
**Estimated effort**: 2-3 hours

---

### ⬜ LICENSE_DATA.md
**Purpose**: License recommendation system documentation
**Key sections**:
- License tier definitions
- Metadata for each supported license
- Update mechanism
- API specification
- Community consensus criteria
**Dependencies**: TECHNICAL_SPEC.md
**Estimated effort**: 2-3 hours

---

### ⬜ FAQ.md
**Purpose**: Common questions and answers (can wait until after v0)
**Dependencies**: PROJECT_OVERVIEW.md
**Estimated effort**: 1 hour

---

## Total Estimated Effort
**Phase 1**: ~10 hours
**Phase 2**: ~14 hours (increased due to license recommendation system)
**Phase 3**: ~7 hours
**Phase 4**: ~6 hours
**Phase 5**: ~6 hours (includes LICENSE_DATA.md)
**Total Core Docs**: ~43 hours

---

## Next Steps

1. ✅ Create this TODO.md
2. Start with PROJECT_OVERVIEW.md
3. Move through phases sequentially
4. Review and cross-reference all docs before coding
5. Create a READY_TO_CODE.md checklist when all docs are complete

---

## Notes
- All docs should be in Markdown format
- Keep docs in `/docs` folder except README.md and CONTRIBUTING.md
- Use clear headings and examples
- Link between docs where relevant
- Update this TODO.md as tasks are completed
