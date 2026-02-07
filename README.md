# Lavarrock

A self-hosted, privacy-first AI copilot editor built as a monorepo.

- **Backend** — Python · FastAPI · Strands Agents (model-agnostic AI)
- **Frontend** — React · Vite · TipTap editor · Y.js collaboration
- **AI Models** — Ollama (local) or AWS Bedrock (managed)
- **Collaboration** — WebSocket + Y.js for real-time multi-user editing
- **Storage** — SQLite for metadata, filesystem for markdown files

## Project Structure

```
lavarrock/
├── backend/                   # Python FastAPI backend
│   └── lavarrock/
│       ├── models/            # Pydantic models & AI provider factory
│       ├── routes/            # API route handlers
│       ├── config.py          # Configuration
│       └── main.py            # FastAPI app entry point
│
├── frontend/                  # Vite + React app
│   └── src/
│       ├── components/        # React components
│       ├── context/           # React context providers
│       ├── i18n/              # Internationalisation
│       ├── lib/               # Shared utilities
│       ├── plugins/           # Frontend plugin integration
│       └── state/             # State management
│
├── cli/                       # CLI toolkit for plugin management
│   └── src/
│       ├── commands/          # CLI command implementations
│       └── lib/               # CLI utilities
│
├── packages/                  # Shared internal packages
│   ├── lavarrock-link/        # Link resolution package
│   └── ui/                    # Shared UI components
│
├── plugins/                   # Plugin ecosystem
│   ├── lavarrock-app-launcher/
│   ├── lavarrock-app-modal/
│   ├── lavarrock-footer/
│   ├── lavarrock-header/
│   ├── lavarrock-json-tool/
│   ├── lavarrock-layout-engine/
│   ├── lavarrock-layout-manager/
│   ├── lavarrock-search-bar/
│   ├── lavarrock-search-modal/
│   ├── lavarrock-settings-engine/
│   ├── lavarrock-settings-manager/
│   ├── lavarrock-theme-engine/
│   ├── lavarrock-theme-import/
│   ├── lavarrock-theme-manager/
│   ├── lavarrock-tooltips/
│   ├── lavarrock-ui/
│   └── lavarrock-wm/
│
├── registry/                  # Plugin registry — builds & serves bundles
│
├── docker-compose.yml         # Local development stack
├── Dockerfile.backend         # Backend container image
├── package.json               # Monorepo root (npm workspaces)
└── pyproject.toml             # Python backend config (Poetry)
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 20
- **Python** ≥ 3.11
- **Docker & Docker Compose** (optional, for full-stack)
- **Ollama** (for local AI inference) _or_ AWS Bedrock credentials

### Local Development

```bash
# 1 — Install frontend dependencies
npm install

# 2 — Install backend dependencies
cd backend && poetry install && cd ..

# 3 — Start the backend (terminal 1)
cd backend && poetry run uvicorn lavarrock.main:app --reload

# 4 — Start the frontend (terminal 2)
npm run dev -w frontend
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000>
- API Docs (Swagger): <http://localhost:8000/docs>

### Docker

```bash
docker-compose up
```

## Development Commands

```bash
# From the root
npm run dev           # Start both frontend and backend
npm run build         # Build everything
npm run test          # Run all tests
npm run lint          # Lint all code
npm run format        # Format all code
npm run type-check    # Type-check frontend & backend
npm run clean         # Clean build artifacts
```

## Configuration

User configuration lives in `.lavarrock/settings.json`:

```jsonc
{
  "lavarrock": {
    "ai": {
      "chat": {
        "provider": "ollama",
        "host": "http://localhost:11434",
        "model_id": "llama3.1:latest",
        "temperature": 0.7,
      },
      "completion": {
        "provider": "ollama",
        "model_id": "qwen2.5-coder:7b",
        "temperature": 0.3,
      },
    },
  },
}
```

Create a `.env` file in the backend directory for environment-specific overrides:

```bash
OLLAMA_HOST=http://localhost:11434
AWS_REGION=us-west-2
LOG_LEVEL=INFO
```

## Tech Stack

| Layer         | Technology              | Purpose                 |
| ------------- | ----------------------- | ----------------------- |
| Frontend      | Vite + React 18         | App shell, fast builds  |
| Editor        | TipTap v2 + ProseMirror | Rich text editing       |
| Collaboration | Y.js + Hocuspocus       | Real-time multi-user    |
| State         | Redux Toolkit           | Frontend state          |
| Styling       | Tailwind CSS v4         | Utility-first CSS       |
| Backend       | FastAPI (Python)        | REST API, WebSocket     |
| AI Framework  | Strands Agents          | Model-agnostic AI logic |
| Models        | Ollama + AWS Bedrock    | User-configurable LLMs  |
| Database      | SQLite + FTS5           | Metadata & search       |
| Deployment    | Docker Compose          | Self-hosting            |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[GNU General Public License v2.0](LICENSE)
