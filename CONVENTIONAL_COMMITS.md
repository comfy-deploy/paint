# Conventional Commits & Automated Versioning

This project uses conventional commits with automated version bumping and changelog generation.

## 🚀 Quick Start

### Making a Commit

```bash
# Use the interactive commit tool (recommended)
bun run commit

# Or use git-cz directly
bunx git-cz
```

### Creating a Release

```bash
# Dry run to see what would be released
bun run release:dry-run

# Create a release (usually done via CI/CD)
bun run release
```

## 📝 Commit Message Format

Use the following format for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools
- **ci**: Changes to our CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies
- **revert**: Reverts a previous commit

### Examples

```bash
feat: add image editing capabilities
fix: resolve API key validation issue
docs: update installation instructions
style: format code with prettier
refactor: simplify image processing logic
perf: optimize image loading performance
test: add unit tests for config module
chore: update dependencies
ci: add automated release workflow
build: configure bun build settings
revert: revert breaking change in v1.2.0
```

### Breaking Changes

Use `!` after the type/scope to indicate a breaking change:

```bash
feat!: redesign CLI interface
fix!: change API response format
```

Or use the footer:

```bash
feat: add new configuration option

BREAKING CHANGE: The config file format has changed
```

## 🔄 Automated Versioning

The project uses [semantic-release](https://semantic-release.gitbook.io/) for automated version bumping:

- **patch** (1.0.0 → 1.0.1): `fix` commits
- **minor** (1.0.0 → 1.1.0): `feat` commits
- **major** (1.0.0 → 2.0.0): commits with `BREAKING CHANGE` or `!`

## 📋 Available Scripts

```bash
# Commit with conventional format
bun run commit

# Retry last commit
bun run commit:retry

# Generate changelog
bun run changelog

# Generate full changelog
bun run changelog:all

# Create release (dry run)
bun run release:dry-run

# Create release
bun run release
```

## 🛠️ Git Hooks

The project includes pre-configured git hooks:

- **pre-commit**: Runs lint-staged to format code
- **commit-msg**: Validates commit message format

## 📁 Configuration Files

- `commitlint.config.js` - Commit message validation rules
- `.prettierrc` - Code formatting rules
- `.husky/` - Git hooks configuration
- `package.json` - Scripts and semantic-release configuration

## 🔧 Customization

### Commitlint Rules

Edit `commitlint.config.js` to modify validation rules:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor']],
    'subject-max-length': [2, 'always', 50],
  },
};
```

### Prettier Configuration

Edit `.prettierrc` to customize code formatting:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 4
}
```

### Semantic Release Configuration

Modify the `release` section in `package.json` to customize release behavior.

## 🚨 Troubleshooting

### Commit Message Validation Fails

If your commit message doesn't follow the conventional format:

```bash
# Fix the last commit message
git commit --amend

# Or use the interactive tool
bun run commit:retry
```

### Release Fails

Check the semantic-release logs:

```bash
bun run release:dry-run
```

Common issues:

- Missing `GITHUB_TOKEN` or `NPM_TOKEN`
- Invalid commit messages
- No changes since last release

## 📚 Learn More

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Commitizen](http://commitizen.github.io/cz-cli/)
- [Commitlint](https://commitlint.js.org/)
