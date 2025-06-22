# rulink

Stop manually copying Cursor rules between projects. Automatically install and manage Cursor AI rules from GitHub repos, NPM packages, and local folders.

[![npm version](https://badge.fury.io/js/%40necolo%2Fcursor-rules.svg)](https://badge.fury.io/js/%40necolo%2Fcursor-rules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📖 Table of Contents

- [rulink](#rulink)
  - [📖 Table of Contents](#-table-of-contents)
  - [🌟 Introduction](#-introduction)
  - [🚀 Quick Start](#-quick-start)
  - [📦 Installation](#-installation)
    - [Using with npx (Recommended)](#using-with-npx-recommended)
    - [Global Installation](#global-installation)
  - [🔧 Commands](#-commands)
    - [`add` - Add a Rule Source](#add---add-a-rule-source)
    - [`source` - Manage Rule Sources](#source---manage-rule-sources)
    - [`list` - List Available Rules](#list---list-available-rules)
    - [`install` - Install Cursor Rules](#install---install-cursor-rules)
    - [`status` - Show Project Status](#status---show-project-status)
    - [`update` - Update Installed Rules](#update---update-installed-rules)
    - [`remove` - Remove Cursor Rules](#remove---remove-cursor-rules)
  - [💡 Usage Examples](#-usage-examples)
    - [Setting Up a New Project](#setting-up-a-new-project)
    - [Working with Multiple Sources](#working-with-multiple-sources)
    - [Selective Rule Installation](#selective-rule-installation)
    - [Keeping Rules Updated](#keeping-rules-updated)
  - [📚 Source Types](#-source-types)
    - [Local Directory](#local-directory)
    - [GitHub Repository](#github-repository)
    - [NPM Package](#npm-package)
  - [🤝 Contributing](#-contributing)
    - [Development Setup](#development-setup)
  - [📄 License](#-license)

## 🌟 Introduction

**rulink** is a powerful command-line tool that simplifies the management of Cursor AI rules across your projects. Instead of manually copying and pasting cursor rules between different projects, rulink allows you to:

- **Centralize rule management**: Store rules in GitHub repositories, NPM packages, or local directories
- **Easy installation**: Install rules with a single command across multiple projects
- **Version control**: Keep your rules updated and synchronized
- **Project-specific**: Manage different rule sets for different types of projects
- **Source flexibility**: Support for local paths, GitHub repositories, and NPM packages

Whether you're working on TypeScript projects, React applications, or any other codebase that benefits from Cursor AI rules, rulink streamlines your workflow by automating rule management.

## 🚀 Quick Start

```bash
# Add a rule source (choose one)
npx rulink add /path/to/local/rules              # Local directory
npx rulink add https://github.com/user/repo     # GitHub repository
npx rulink add @your-org/cursor-rules            # NPM package

# List available rules
npx rulink list

# Install all rules to current project
npx rulink install

# Check installation status
npx rulink status
```

## 📦 Installation

### Using with npx (Recommended)

No installation required! Use directly with npx:

```bash
npx rulink <command>
```

### Global Installation

For frequent use, install globally:

```bash
npm install -g rulink
# Then use without npx prefix
rulink <command>
```

## 🔧 Commands

### `add` - Add a Rule Source

Add a new rule source from various locations.

**Usage:**
```bash
rulink add <path|url|package> [options]
```

**Options:**
- `--verbose` - Show detailed output during the add process

**Examples:**
```bash
# Add local directory
rulink add ./my-cursor-rules
rulink add /absolute/path/to/rules

# Add GitHub repository
rulink add https://github.com/PatrickJS/awesome-cursorrules
rulink add github:user/repo

# Add NPM package
rulink add @mallardbay/cursor-rules
rulink add my-cursor-rules-package
```

### `source` - Manage Rule Sources

View and manage configured rule sources.

**Usage:**
```bash
rulink source [sourceName] [options]
```

**Options:**
- `-l, --list, --all` - List all configured sources
- `--use <sourceName>` - Set a source as active
- `--remove <sourceName>` - Remove a specific source
- `--remove-all` - Remove all sources
- `--rename <newName>` - Rename a source
- `--verbose` - Show detailed output

**Examples:**
```bash
# Show active source details
rulink source

# Show specific source details
rulink source my-source

# List all sources
rulink source --list

# Set active source
rulink source --use my-github-source

# Remove a source
rulink source --remove old-source

# Rename a source
rulink source --rename old-name new-name

# Remove all sources
rulink source --remove-all
```

### `list` - List Available Rules

Display all available rules from the active or specified source.

**Usage:**
```bash
rulink list [options]
```

**Options:**
- `--source <name>` - List rules from a specific source instead of active source

**Examples:**
```bash
# List rules from active source
rulink list

# List rules from specific source
rulink list --source my-typescript-rules
```

**Sample Output:**
```
Available Rules from typescript-rules:

typescript/
  - style.mdc
    Coding style guidelines for TypeScript
  - types.mdc
    TypeScript type definitions and patterns

react/
  - components.mdc
    React component patterns and best practices

general.mdc
  Basic development principles
```

### `install` - Install Cursor Rules

Install cursor rules to your project's `.cursor/rules` directory.

**Usage:**
```bash
rulink install [...rulePaths] [options]
```

**Options:**
- `--to <path>` - Specify target directory (default: auto-detect project root)
- `--source <name>` - Use specific source instead of active source
- `--dry-run` - Preview what would be installed without making changes
- `--verbose` - Show detailed installation process

**Examples:**
```bash
# Install all available rules
rulink install

# Install specific rule files
rulink install style.mdc
rulink install typescript/style.mdc react/components.mdc

# Install all rules from a category
rulink install typescript

# Install to specific directory
rulink install --to /path/to/project

# Preview installation (dry run)
rulink install --dry-run

# Install from specific source
rulink install --source my-backup-rules
```

**Rule Path Formats:**
- `filename.mdc` - Root level rule file
- `category/filename.mdc` - Rule file in specific category
- `category` - All rules in a category
- Multiple paths supported: `rulink install general typescript/style.mdc`

### `status` - Show Project Status

Display the status of installed rules in the current project.

**Usage:**
```bash
rulink status
```

**Examples:**
```bash
rulink status
```

**Sample Output:**
```
Cursor Rules Status for: /Users/dev/my-project (project rules)

Installed rules:
  ✓ style
  ✓ types
  ✓ components

Available but not installed:
  - testing
  - performance
```

### `update` - Update Installed Rules

Update all installed rules to their latest versions from the source.

**Usage:**
```bash
rulink update
```

**Examples:**
```bash
# Update all installed rules
rulink update
```

**Interactive Process:**
When multiple rules with the same filename exist in different categories, rulink will prompt you to choose which one to use:

```
Multiple rules found for style.mdc:
  1. typescript/style.mdc - TypeScript coding standards
  2. general/style.mdc - General style guidelines
  3. Skip this rule

Please select which rule to update (number): 1
```

### `remove` - Remove Cursor Rules

Remove specific cursor rule files from your project.

**Usage:**
```bash
rulink remove [...ruleFiles]
```

**Examples:**
```bash
# Remove specific rule files
rulink remove style.mdc
rulink remove typescript/style.mdc components.mdc

# Remove multiple rules
rulink remove style types components
```

## 💡 Usage Examples

### Setting Up a New Project

```bash
# Add your organization's rule source
npx rulink add @myorg/cursor-rules

# Install all rules for the project
npx rulink install

# Check what was installed
npx rulink status
```

### Working with Multiple Sources

```bash
# Add multiple sources
npx rulink add @myorg/typescript-rules
npx rulink add @myorg/react-rules
npx rulink add ./local-custom-rules

# List all sources
npx rulink source --list

# Switch between sources
npx rulink source --use typescript-rules
npx rulink install typescript

npx rulink source --use react-rules  
npx rulink install react
```

### Selective Rule Installation

```bash
# Install only specific rules
npx rulink install typescript/style.mdc general/principles.mdc

# Install all rules from a category
npx rulink install typescript

# Preview before installing
npx rulink install --dry-run
```

### Keeping Rules Updated

```bash
# Update all installed rules
npx rulink update

# Check status after update
npx rulink status
```

## 📚 Source Types

### Local Directory

Point to a local directory containing `.mdc` files:

```bash
rulink add ./my-rules
rulink add /absolute/path/to/rules
```

**Directory Structure:**
```
my-rules/
├── general.mdc
├── typescript/
│   ├── style.mdc
│   └── types.mdc
└── react/
    └── components.mdc
```

### GitHub Repository

Add rules from GitHub repositories:

```bash
rulink add https://github.com/user/repo
rulink add https://github.com/user/repo/tree/main/rules
rulink add github:user/repo
```

### NPM Package

Use published NPM packages:

```bash
rulink add @myorg/cursor-rules
rulink add cursor-rules-package
```

**Package Structure:**
Your NPM package should contain `.mdc` files in the root or organized in subdirectories.

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/necolo/cursor-rules.git

# Install dependencies
cd cursor-rules
pnpm install

# Run tests
pnpm test:run

# Build the project
pnpm build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[⬆ Back to Top](#rulink)**

Made with ❤️ by the Necolo Lv.C

[GitHub](https://github.com/necolo/cursor-rules) • [NPM](https://www.npmjs.com/package/@necolo/cursor-rules) • [Issues](https://github.com/necolo/cursor-rules/issues)

</div>

