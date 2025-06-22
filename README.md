# rulink

> Stop manually copying Cursor rules between projects. Automatically install and manage Cursor AI rules from GitHub repos, NPM packages, and local folders.

[![npm version](https://badge.fury.io/js/%40necolo%2Fcursor-rules.svg)](https://badge.fury.io/js/%40necolo%2Fcursor-rules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
# Add a local rule source
npx rulink source --add /path/to/local/rules

# Or: add a rule source from github
npx rulink source --add https://github.com/PatrickJS/awesome-cursorrules/blob/main/rules-new/typescript.mdc

# Or: add ad rule source from npm
npx rulink source --add @mallardbay/cursor-rules

# List available sources
npx rulink source list

# Install specific rule files
npx rulink install style.mdc typescript/code-style.mdc

# List available rules from active source
npx rulink list
```

## 📦 Installation

### Using with npx (Recommended)

No installation required! Use directly:

```bash
npx rulink <command>
```

### Global Installation

```bash
npm install -g rulink
# Then use without npx prefix
cursor-rules install react typescript
```

### Local Installation

```bash
npm install --save-dev rulink
# Then use with npx
npx cursor-rules --help
```

## 🎯 What are Cursor Rules?

Cursor rules are configuration files that help [Cursor AI](https://cursor.sh/) understand your coding standards, patterns, and preferences. They guide the AI to generate code that follows your project's conventions automatically.

This CLI helps you:
- 📂 **Manage** multiple rule sources (local folders, GitHub repos, NPM packages)
- 📋 **Install** specific rule files to your projects
- 🔄 **Update** rules from their sources
- 🗑️ **Remove** rules you no longer need
- 🔄 **Switch** between different rule sources

## 📚 CLI Commands

> **Note**: All examples below use `npx rulink`. If you've installed globally, you can use `cursor-rules` directly.

### Source Management

#### `source add <input>`

Add a new rule source. The CLI auto-detects the source type based on the input format.

```bash
# Add local folder (auto-detected)
npx rulink source add /path/to/local/rules

# Add GitHub repository
npx rulink source add --github github.com/user/awesome-cursor-rules
npx rulink source add --github https://github.com/user/awesome-cursor-rules

# Add NPM package
npx rulink source add --npm @company/cursor-rules

# GitHub with specific branch and path
npx rulink source add --github github.com/user/repo --branch develop --path rules/folder
```

**Options:**
- `--github` - Specify input as GitHub repository
- `--npm` - Specify input as NPM package
- `--branch <branch>` - GitHub branch to use (default: main)
- `--path <path>` - Path within GitHub repository
- `--verbose` - Show detailed output

#### `source list`

List all configured sources and show which one is active.

```bash
npx rulink source list
```

Example output:
```
Configured Sources:

● my-local-rules (active)
  Type: local
  Path: /Users/me/cursor-rules

○ awesome-prompts
  Type: github
  URL: https://github.com/user/awesome-cursor-rules
  Branch: main
```

#### `source use <name>`

Set the active source for rule operations.

```bash
npx rulink source use awesome-prompts
```

#### `source remove <name>`

Remove a configured source.

```bash
npx rulink source remove awesome-prompts
```

### Rule Installation

#### `install <rulePaths...>`

Install specific rule files from the active source.

```bash
# Install specific rule files
npx rulink install style.mdc typescript/code-style.mdc

# Install to specific directory
npx rulink install style.mdc --to /path/to/project

# Use a different source temporarily
npx rulink install style.mdc --source my-other-source

# Preview what would be installed
npx rulink install style.mdc --dry-run

# Verbose output
npx rulink install style.mdc --verbose
```

**Options:**
- `--to <path>` - Target path to install rules (defaults to current project root)
- `--source <name>` - Use specific source instead of active source
- `--dry-run` - Show what would be installed without making changes
- `--verbose` - Show detailed output

### Other Commands

#### `list`

List all available rules from the active source.

```bash
# List from active source
npx rulink list

# List from specific source
npx rulink list --source my-other-source
```

Example output:
```
Available Rules from my-local-rules:

style.mdc
doc.mdc

typescript/
  - code-style.mdc
  - best-practices.mdc
```

#### `update`

Update all installed rules by reinstalling them from their sources.

```bash
npx rulink update
```

#### `remove <ruleFiles...>`

Remove installed rule files from the current project.

```bash
npx rulink remove style.mdc typescript/code-style.mdc
```

#### `status`

Show the status of installed rules in the current project.

```bash
npx rulink status
```

## 📂 Rule Source Examples

The CLI supports multiple source types for maximum flexibility:

### 🗂️ Local Folders
Store rules in any local directory structure:
```bash
my-rules/
├── style.mdc
├── documentation.mdc
└── typescript/
    ├── best-practices.mdc
    └── code-style.mdc
```

### 📦 NPM Packages
Publish and share rules via NPM:
```bash
@company/cursor-rules/
├── package.json
├── general.mdc
└── react/
    └── standards.mdc
```

### 🐙 GitHub Repositories
Share rules through GitHub repositories:
```bash
awesome-cursor-rules/
├── README.md
├── basic-principles.mdc
└── languages/
    ├── typescript.mdc
    └── python.mdc
```

### Example Rule Collections
- **[necolo/cursor-rules](https://github.com/necolo/cursor-rules)** - This repository's rule collection
- Create your own and share with the community!

## 🏗️ How It Works

1. **Source Management**: Configure rule sources (local folders, GitHub repos, NPM packages) globally in `~/.cursor-rules/config.json`

2. **Project Detection**: The CLI automatically finds your project root by looking for common project files (`package.json`, `.git`, etc.)

3. **Rule Installation**: Specific rule files are downloaded from your active source and installed to your project's `.cursor/rules/` directory

4. **Fresh Fetching**: Rules are fetched fresh from their sources each time, ensuring you always get the latest versions

When you install rules, they're organized like this:

```
your-project/
└── .cursor/
    └── rules/
        ├── style.mdc
        ├── documentation.mdc
        ├── best-practices.mdc
        └── code-style.mdc
```

Global configuration is stored at:
```
~/.cursor-rules/
└── config.json    # Your configured sources and active source
```

## 📖 Usage Examples

### Setting up rule sources

```bash
# Add your company's rule collection
npx rulink source add --npm @mycompany/cursor-rules

# Add a popular GitHub rule collection
npx rulink source add --github github.com/awesome-dev/cursor-rules

# Add your personal local rules
npx rulink source add ~/my-cursor-rules

# List available sources
npx rulink source list
```

### Installing rules to a project

```bash
# Navigate to your project
cd my-react-app

# Install specific rule files
npx rulink install style.mdc typescript/best-practices.mdc

# Check what was installed
npx rulink status
```

### Working with multiple sources

```bash
# Switch to a different source
npx rulink source use company-rules

# Install from a specific source without switching
npx rulink install style.mdc --source personal-rules

# Install to a different project
npx rulink install style.mdc --to ./my-other-project
```

### Preview and management

```bash
# See what would be installed
npx rulink install style.mdc --dry-run

# List available rules from active source
npx rulink list

# Update all installed rules
npx rulink update
```

## 🎯 Project Overview

This project provides a flexible CLI tool for managing Cursor AI rules from multiple sources:

- **📦 CLI Tool** - Manage rules from local folders, GitHub repos, and NPM packages
- **🔄 Source Management** - Configure and switch between multiple rule sources
- **📚 Example Rules** - Sample rule collections to get you started
- **🌐 Community** - Share and discover rule collections

### Key Features

- **Multi-Source Support**: Local folders, GitHub repositories, NPM packages
- **Global Configuration**: Manage sources globally, install rules per-project
- **Fresh Fetching**: Always get the latest rules from their sources
- **Flexible Structure**: Support for flat or categorized rule organization
- **Authentication**: GitHub integration with git credentials for private repos

### Repository Structure

```
cursor-rules/
├── packages/
│   ├── cli/                    # CLI tool for managing rules
│   │   ├── src/
│   │   │   ├── commands/       # CLI command implementations
│   │   │   ├── sources/        # Source provider implementations
│   │   │   ├── config/         # Configuration management
│   │   │   └── index.ts        # Main CLI entry point
│   │   └── package.json
│   └── rules/                  # Example rule collections
│       ├── general/           # General coding standards
│       ├── react/             # React-specific rules
│       └── typescript/        # TypeScript-specific rules
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

### Working with the CLI

#### Adding New Source Providers

1. Create a new provider class in [`packages/cli/src/sources/providers/`](./packages/cli/src/sources/providers/)
2. Implement the `SourceProvider` interface
3. Add the provider to the `SourceManager`
4. Add tests and documentation

#### Contributing Rules

1. Create your own rule collection repository or NPM package
2. Follow the structure: `.mdc` files in root or single-level subdirectories
3. Share your collection with the community
4. Add it to the examples in this README

### Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode for CLI
- `pnpm test` - Run all tests
- `pnpm changeset` - Create a changeset for releases
- `pnpm publish` - Publish packages to npm

### Publishing Releases

The repository uses GitHub Actions for automated releases. The process is simple:

#### Release Steps

```bash
# 1. Create changeset (describes what changed)
pnpm changeset

# 2. Commit and push to main branch
git add .
git commit -m "Add changeset for [feature/fix description]"
git push origin main

# 3. GitHub Actions automatically handles the rest! 🚀
```

#### What Happens Automatically

When you push to the `main` branch, GitHub Actions will:
- ✅ Build all packages
- ✅ Apply changesets and version packages  
- ✅ Publish to npm
- ✅ Create git tags
- ✅ Generate release notes

#### Alternative: Manual Release (for testing)

If you need to release manually for testing purposes:

```bash
# Full manual release
pnpm release
```

#### Important Notes

- **Only push to main when ready to release** - Every push to main triggers a release
- **Always create changesets first** - They describe what changed and determine version bumps
- **Changesets are required** - Without them, no release will be created

The changeset step is manual because it requires your input about:
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

### Creating Your Own Rule Collection

```bash
# Create a new rule collection
mkdir my-cursor-rules
cd my-cursor-rules

# Add some rules
echo "# Style Guidelines\n\n- Use 2 spaces for indentation" > style.mdc
mkdir typescript
echo "# TypeScript Best Practices\n\n- Use strict mode" > typescript/best-practices.mdc

# Test with the CLI
npx rulink source add /path/to/my-cursor-rules
npx rulink list
npx rulink install style.mdc
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

- **📋 Issues**: [GitHub Issues](https://github.com/necolo/cursor-rules/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/necolo/cursor-rules/discussions)
- **📧 Email**: Open an issue for any questions

## 🗺️ Roadmap

- [ ] Add more source provider types (GitLab, Bitbucket, etc.)
- [ ] Implement rule validation and linting
- [ ] Create web interface for rule source discovery
- [ ] Add rule templates and generators
- [ ] Enhanced authentication for private sources
- [ ] Rule dependency management
- [ ] Integration with popular IDEs beyond Cursor

---

<p align="center">
  <a href="https://github.com/necolo/cursor-rules/stargazers">⭐ Star this repo</a> •
  <a href="https://github.com/necolo/cursor-rules/issues">🐛 Report Bug</a> •
  <a href="https://github.com/necolo/cursor-rules/discussions">💡 Request Feature</a>
</p> 