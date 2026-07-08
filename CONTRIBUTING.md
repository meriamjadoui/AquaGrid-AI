# Contributing to AquaWise

Thank you for your interest in contributing! This document explains how to
set up the project locally, the coding conventions we follow, and the pull
request process.

---

## Prerequisites

| Tool    | Version  |
|---------|----------|
| Node.js | ≥ 18     |
| npm     | ≥ 9      |
| Git     | any recent |

---

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/meriamjadoui/AquaWise.git
cd AquaWise

# 2. Install dashboard dependencies
cd dashboard
npm install

# 3. Start the dev server
npm run dev
# → opens http://localhost:5173
```

No environment variables or API keys are required — all AI inference runs
entirely in the browser.

---

## Project Structure

```
AquaWise/
├── README.md            Project overview and quick-start
├── CONTRIBUTING.md      This file
├── docs/
│   └── AI_ENGINE.md     Deep-dive documentation for all AI models
├── dashboard/           React + Vite frontend
│   ├── src/
│   │   ├── ai/          In-browser ML models (see docs/AI_ENGINE.md)
│   │   ├── pages/       WaterPage, EnergyPage, AIPage, DashboardPage
│   │   ├── components/  Reusable UI components
│   │   └── store/       Zustand global state (sensors, AI results, alerts)
│   └── package.json
├── ai/                  Python notebooks used to train & export the models
└── prototype/           Early HTML/CSS prototype files
```

---

## Coding Conventions

### JavaScript / React
- **ES Modules** — use `import`/`export`, no CommonJS
- **JSDoc** — every exported function must have a `@param` + `@returns` block
- **No external AI deps** — all model inference stays in plain JS (no
  TensorFlow.js, ONNX Runtime, etc.)
- **Zustand for state** — do not use React Context for global state
- **React hooks** — follow the Rules of Hooks; no class components

### AI Model Files
- One file per model (`leak_model.js`, `maintenance_model.js`, …)
- Export a `makeXDetector()` factory that encapsulates the rolling window
- Export a pure `predictX(features)` function for unit testing
- Document every feature in the file-level JSDoc table

---

## Pull Request Process

1. **Fork** the repository and create a feature branch:
   ```bash
   git checkout -b feature/my-improvement
   ```
2. **Make your changes** following the conventions above
3. **Test locally** — run `npm run dev` and verify the dashboard works
4. **Commit** with a clear message:
   ```
   feat: add turbidity model to water quality page
   fix: correct rolling window size in ph_model
   docs: add architecture diagram to AI_ENGINE.md
   ```
5. **Open a Pull Request** against `main` with:
   - A description of what changed and why
   - Screenshots if UI was modified
   - Notes on any new AI features / feature engineering decisions

---

## Reporting Bugs

Open a GitHub Issue and include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser and OS version
- Console error output (if any)

---

## Questions?

Open a GitHub Discussion or reach out via the email in the repository profile.
