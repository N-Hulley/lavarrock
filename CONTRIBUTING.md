# Contributing to Lavarrock

Thanks for your interest in contributing! This document outlines how to get started.

## Getting Started

1. **Fork** the repository and clone your fork.
2. Install dependencies (see [README.md](README.md) for setup instructions).
3. Create a **feature branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
4. Make your changes and ensure tests pass.
5. Submit a **pull request** against `main`.

## Development Setup

```bash
# Install all workspace dependencies
npm install

# Start frontend dev server
npm run dev -w frontend

# Start backend
cd backend && poetry install && poetry run uvicorn lavarrock.main:app --reload
```

## Code Standards

### Frontend (TypeScript / React)

- Use **TypeScript** for all new code.
- Follow existing patterns for components and state management.
- Run `npm run lint` and `npm run type-check` before committing.
- Format with `npm run format`.

### Backend (Python)

- Follow [PEP 8](https://peps.python.org/pep-0008/) conventions.
- Use type hints wherever practical.
- Lint with `ruff check .` and format with `ruff format .`.
- Run `pytest` to ensure tests pass.

### Plugins

- Each plugin lives in `plugins/<plugin-name>/`.
- Follow the existing plugin structure and naming conventions.
- Export a default plugin manifest from `src/index.ts`.

## Pull Requests

- Keep PRs focused — one feature or fix per PR.
- Include a clear description of **what** and **why**.
- Link any related issues.
- Ensure CI checks pass before requesting review.

## Reporting Issues

- Use GitHub Issues to report bugs or request features.
- Include reproduction steps, expected vs actual behaviour, and environment details.

## License

By contributing, you agree that your contributions will be licensed under the [GNU General Public License v2.0](LICENSE).
