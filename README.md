# @necolo/cursor-rules

> A CLI tool and comprehensive collection of curated rules for [Cursor AI](https://cursor.sh/) to enhance your coding experience across different technology stacks.

[![npm version](https://badge.fury.io/js/%40necolo%2Fcursor-rules.svg)](https://badge.fury.io/js/%40necolo%2Fcursor-rules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Use directly with npx (no installation required)
npx @necolo/cursor-rules install react typescript

# List available rule categories
npx @necolo/cursor-rules list

# Check current project status
npx @necolo/cursor-rules status
```

## 📦 Installation

### Using with npx (Recommended)

No installation required! Use directly:

```bash
npx @necolo/cursor-rules <command>
```

### Global Installation

```bash
npm install -g @necolo/cursor-rules
# Then use without npx prefix
cursor-rules install react typescript
```

### Local Installation

```bash
npm install --save-dev @necolo/cursor-rules
# Then use with npx
npx cursor-rules --help
```

## 🎯 What are Cursor Rules?

Cursor rules are configuration files that help [Cursor AI](https://cursor.sh/) understand your coding standards, patterns, and preferences. They guide the AI to generate code that follows your project's conventions automatically.

This CLI helps you:
- 📋 **Install** curated rule sets for different tech stacks
- 🔄 **Update** rules to the latest versions
- 📊 **Track** which rules are installed in your projects
- 🗑️ **Remove** rules you no longer need

## 📚 CLI Commands

> **Note**: All examples below use `npx @necolo/cursor-rules`. If you've installed globally, you can use `cursor-rules` directly.

### `install <categories...>`

Install cursor rules for specified categories.

```bash
# Install React and TypeScript rules
npx @necolo/cursor-rules install react typescript

# Install to specific directory
npx @necolo/cursor-rules install react --to /path/to/project

# Preview what would be installed
npx @necolo/cursor-rules install react --dry-run

# Verbose output
npx @necolo/cursor-rules install react --verbose
```

**Options:**
- `--to <path>` - Target path to install rules (defaults to current project root)
- `--dry-run` - Show what would be installed without making changes
- `--verbose` - Show detailed output

### `list`

List all available cursor rule categories and their descriptions.

```bash
npx @necolo/cursor-rules list
```

Example output:
```
Available Cursor Rules:

general/
  - basic-principles
  - doc
  - riper-5

react/
  - ts-react

typescript/
  - style
```

### `status`

Show the status of installed rules in the current project.

```bash
npx @necolo/cursor-rules status
```

### `update`

Update all installed rules to their latest versions.

```bash
npx @necolo/cursor-rules update
```

### `remove <categories...>`

Remove cursor rules for specified categories.

```bash
npx @necolo/cursor-rules remove react typescript
```

## 📂 Available Rule Categories

### 🌐 General
- **[basic-principles](./packages/rules/general/basic-principles.mdc)** - Core programming philosophy and design principles (SOLID, KISS, YAGNI)
- **[doc](./packages/rules/general/doc.mdc)** - Documentation standards and README maintenance guidelines  
- **[riper-5](./packages/rules/general/riper-5.mdc)** - Strict operational protocol for AI assistance and code collaboration

### ⚛️ React
- **[ts-react](./packages/rules/react/ts-react.mdc)** - Comprehensive React + TypeScript development standards and best practices

### 📘 TypeScript
- **[style](./packages/rules/typescript/style.mdc)** - TypeScript coding style guidelines and import path conventions

## 🏗️ How It Works

1. **Project Detection**: The CLI automatically finds your project root by looking for common project files (`package.json`, `.git`, etc.)

2. **Rules Installation**: Rules are installed to your project's `.cursor/rules/` directory

3. **File Management**: Each rule category contains `.mdc` files that Cursor AI reads to understand your preferences

When you install rules, they're organized like this:

```
your-project/
└── .cursor/
    └── rules/
        ├── basic-principles.mdc
        ├── doc.mdc
        ├── riper-5.mdc
        ├── ts-react.mdc
        └── style.mdc
```

## 📖 Usage Examples

### Setting up a new React TypeScript project

```bash
# Navigate to your project
cd my-react-app

# Install React and TypeScript rules  
npx @necolo/cursor-rules install react typescript general

# Check what was installed
npx @necolo/cursor-rules status
```

### Updating rules across multiple projects

```bash
# In each project directory
npx @necolo/cursor-rules update

# Or specify a path
npx @necolo/cursor-rules install react --to ./my-other-project
```

### Preview before installing

```bash
# See what would be installed
npx @necolo/cursor-rules install react typescript --dry-run
```

## 🎯 Project Overview

This monorepo provides:

- **📦 CLI Tool** - Easy installation and management of cursor rules across projects
- **📚 Rule Collections** - Curated sets of coding standards and AI prompts for popular tech stacks
- **🔧 Developer Tools** - Scripts and utilities for maintaining and syncing rules

### Repository Structure

```
cursor-rules/
├── packages/
│   ├── cli/                    # CLI tool for managing rules
│   │   ├── src/
│   │   │   ├── commands/       # CLI command implementations
│   │   │   ├── utils/          # Helper utilities
│   │   │   └── index.ts        # Main CLI entry point
│   │   └── package.json
│   └── rules/                  # Rule collections
│       ├── general/           # General coding standards
│       ├── react/             # React-specific rules
│       └── typescript/        # TypeScript-specific rules
├── scripts/
│   └── sync-rules.ts          # Script to sync rules between packages
└── package.json               # Monorepo configuration
```

## 🔧 Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/necolo/cursor-rules.git
cd cursor-rules

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Working with Rules

#### Adding New Rules

1. Create a new `.mdc` file in the appropriate category under [`packages/rules/`](./packages/rules)
2. Follow the existing naming convention and structure
3. Run the sync script to update package references:
   ```bash
   pnpm sync-rules
   ```
4. Test your changes with the CLI

#### Adding New Categories

1. Create a new directory under [`packages/rules/`](./packages/rules)
2. Add your rule files to the new category
3. Update the CLI code to recognize the new category
4. Add documentation and tests

### Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode for CLI
- `pnpm test` - Run all tests
- `pnpm sync-rules` - Sync rules between packages
- `pnpm changeset` - Create a changeset for releases
- `pnpm publish` - Publish packages to npm (simplified workflow)

### Publishing Releases

The repository is set up with an automated release workflow using changesets. Here's the simplified process:

#### Quick Release (Recommended)

```bash
# 1. Create changeset (describes what changed)
pnpm changeset

# 2. Publish everything
pnpm publish
```

#### Release Options

- **`pnpm publish`** - Quick publish (versions + builds + publishes)
- **`pnpm release:full`** - Full automated release (includes changeset creation)
- **`pnpm release:prepare`** - Prepare release (changeset + version + commit)

#### Detailed Steps

When you run `pnpm publish`, it automatically:
- ✅ Applies existing changesets and versions packages
- ✅ Builds all packages  
- ✅ Publishes to npm
- ✅ Creates git tags

The changeset step is kept separate because it requires your input about:
- What changed in this release
- Type of release (patch/minor/major)
- Release notes for the changelog

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### How to Contribute

1. **🍴 Fork** the repository
2. **🌿 Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **✨ Add** your changes (new rules, CLI improvements, documentation)
4. **🧪 Test** your changes (`pnpm test`)
5. **📝 Commit** your changes (`git commit -m 'Add some amazing feature'`)
6. **🚀 Push** to the branch (`git push origin feature/amazing-feature`)
7. **🔄 Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Use meaningful commit messages
- Ensure all tests pass before submitting

### Contributing New Rules

```bash
# Create a new rule file
echo "# My Custom Rule\n\n- Rule description here" > packages/rules/react/my-custom-rule.mdc

# Sync the changes
pnpm sync-rules

# Test the new rule
pnpm build
npx @necolo/cursor-rules list
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

- **📋 Issues**: [GitHub Issues](https://github.com/necolo/cursor-rules/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/necolo/cursor-rules/discussions)
- **📧 Email**: Open an issue for any questions

## 🙏 Acknowledgments

- [Cursor AI](https://cursor.sh/) - For creating an amazing AI-powered code editor
- Contributors - Thank you to everyone who has contributed rules and improvements
- Community - For feedback and suggestions that make this project better

## 🗺️ Roadmap

- [ ] Add more programming language support
- [ ] Implement rule validation and linting
- [ ] Create web interface for rule management
- [ ] Add rule templates and generators
- [ ] Integration with popular IDEs

---

<p align="center">
  <strong>Made with ❤️ for the <a href="https://cursor.sh/">Cursor AI</a> community</strong>
</p>

<p align="center">
  <a href="https://github.com/necolo/cursor-rules/stargazers">⭐ Star this repo</a> •
  <a href="https://github.com/necolo/cursor-rules/issues">🐛 Report Bug</a> •
  <a href="https://github.com/necolo/cursor-rules/discussions">💡 Request Feature</a>
</p> 