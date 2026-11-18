# CI & Workflow Automation Module (.github/workflows)

This directory contains GitHub Actions workflows ensuring code quality, security, and build integrity across the District 13 monorepo.

---

## 🛠️ Continuous Integration Pipeline (`ci.yml`)

The `ci.yml` pipeline triggers automatically on:

- **Push** to `master` or `main` branches
- **Pull Request** targeting `master` or `main` branches

### 4 Mandatory Quality Gates:

1. **Code Quality (Oxlint)**:
   - High-performance linting across root, frontend, and backend.
   - **Acceptance Criteria (AC)**: 0 lint errors.

2. **TypeScript Strict Typecheck**:
   - Comprehensive type verification in frontend (`tsc -b --noEmit`) and backend (`tsc --noEmit`).
   - Blocks runtime type issues before reaching staging or production.

3. **Automated Unit Tests (Vitest)**:
   - Executes backend Vitest suites using a dedicated testing environment (`NODE_ENV=test`).

4. **Dependency Security Audit (`npm audit`)**:
   - Audits root, frontend, and backend dependencies.
   - **Threshold**: Automatically fails the build if high or critical vulnerabilities are introduced (`--audit-level=high`).

---

## 🔒 Branch Protection Policy (Required Status Checks)

As specified in M0-INF (T-03):

- The status checks from `CI Pipeline` (`lint`, `typecheck`, `test`, `security`) **must be configured as required status checks** on `main` and `master` branches in GitHub repository settings.
- Pull requests with linting or type errors cannot be merged.
