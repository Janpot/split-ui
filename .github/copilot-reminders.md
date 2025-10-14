# Copilot Reminders

This file contains important reminders for GitHub Copilot when working on this repository.

## Code Quality Checklist

Before committing changes, always run:

1. **Linting**: `pnpm lint` - Check for code quality issues
2. **Formatting**: `pnpm format` - Format code with Prettier
3. **Type checking**: `pnpm typescript` - Verify TypeScript types (if applicable)

## Formatting

- Always run `pnpm format` (or `pnpm prettier --write`) before committing
- This repository uses Prettier for code formatting
- Configuration is in `prettier.config.js`

## Common Patterns

### React Components

- Server Components: Use `'server-only'` directive, can be `async`, no hooks
- Client Components: Use `'use client'` directive, can use hooks, cannot be `async`
- Always follow React's rules about purity and refs

### ESLint

- Using flat config format (ESLint 9.x)
- React Compiler rules are enabled via `eslint-plugin-react-hooks` v7.0.0
- Configuration in `eslint.config.js`

## Git Workflow

- Make small, incremental commits
- Run all checks before committing
- Use descriptive commit messages
