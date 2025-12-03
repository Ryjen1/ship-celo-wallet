# GitHub Issues Setup Guide

This guide explains how to set up and use the GitHub issue creation system for the Celo Wallet Starter Kit project.

## 🎯 Overview

The issue management system includes:

- **GitHub Issue Templates** - Pre-defined templates for different types of issues
- **CLI Script** - Programmatically create issues from the command line
- **Interactive Mode** - Step-by-step issue creation wizard
- **NPM Scripts** - Convenient commands for creating issues

## 🚀 Quick Start

### 1. Repository Setup

**Issue templates are automatically enabled** - When someone visits your GitHub repository and clicks "New issue", they'll see the templates you created.

### 2. Configure Labels (Optional)

GitHub will automatically apply labels based on the template used, but you can also manually configure additional labels:

```
bug (red) - 🐛
enhancement (yellow) - ✨  
documentation (blue) - 📚
needs-triage (orange) - 🔍
high-priority (red) - 🔥
```

## 📋 Issue Templates

The system includes 4 pre-built issue templates:

### 1. Bug Report Template
- **Trigger**: Issues with `[BUG]` prefix or "bug" type selection
- **Labels**: `bug`, `needs-triage`
- **Use for**: Reporting bugs, errors, and unexpected behavior

### 2. Feature Request Template
- **Trigger**: Issues with `[FEATURE]` prefix or "feature" type selection
- **Labels**: `enhancement`, `needs-triage`
- **Use for**: New feature proposals and improvements

### 3. Enhancement Template
- **Trigger**: Issues with `[ENHANCEMENT]` prefix or "enhancement" type selection
- **Labels**: `enhancement`, `needs-triage`
- **Use for**: Improvements to existing functionality

### 4. Documentation Template
- **Trigger**: Issues with `[DOCS]` prefix or "documentation" type selection
- **Labels**: `documentation`, `needs-triage`
- **Use for**: Documentation issues, missing guides, unclear explanations

## 🤖 Issue Templates (Manual Creation)

### Using GitHub's Built-in Templates

GitHub provides built-in support for issue templates. When someone creates a new issue on your repository, they'll see options for:
- Bug report
- Feature request  
- Documentation
- Enhancement

These templates are stored in `.github/ISSUE_TEMPLATE/` and provide structured forms for creating quality issues.

```bash
# Creates a bug report
git commit -m "[BUG] Wallet connection fails on mobile devices"

# Creates a feature request
git commit -m "[FEATURE] Add transaction history display"

# Creates a documentation issue
git commit -m "[DOCS] Update setup instructions for Windows"

# Creates a generic task
git commit -m "[TODO] Refactor wallet connection logic"
```

### Automatic Test Failure Detection

When tests fail in the CI/CD pipeline, the system automatically creates an issue:
- **Title**: `🔴 Tests Failing in [branch-name]`
- **Labels**: `bug`, `testing`, `auto-created`
- **Auto-closes**: When tests pass again

### Security Issue Detection

Security-related commits are automatically flagged:
```bash
git commit -m "[SECURITY] Fix XSS vulnerability in wallet component"
git commit -m "[SECURITY-FIX] Update vulnerable dependencies"
```

## 💻 CLI Script Usage

### Interactive Mode (Recommended for beginners)

```bash
# Run the interactive wizard
node scripts/create-issue.js --interactive
```

The interactive mode will guide you through:
1. Selecting issue type
2. Entering title and description
3. Setting priority
4. Assigning to team members

### Command Line Mode

```bash
# Create a bug report
node scripts/create-issue.js \
  --type bug \
  --title "Wallet connection timeout" \
  --description "Users experience timeout when connecting to Celo Mainnet" \
  --priority high \
  --assignee your-username

# Create a feature request
node scripts/create-issue.js \
  --type feature \
  --title "Add multi-wallet support" \
  --priority medium

# Create documentation issue
node scripts/create-issue.js \
  --type documentation \
  --title "Missing setup instructions for Linux" \
  --description "The setup guide doesn't cover Linux installation"
```

### Script Options

| Option | Shorthand | Description | Required |
|--------|-----------|-------------|----------|
| `--type` | `-t` | Issue type: bug, feature, enhancement, documentation | Yes (CLI mode) |
| `--title` | `-T` | Issue title | Yes (CLI mode) |
| `--description` | `-D` | Issue description or body | No |
| `--priority` | `-P` | Priority: low, medium, high, critical | No |
| `--assignee` | `-A` | GitHub username to assign | No |
| `--interactive` | `-i` | Run in interactive mode | No |

## 🔧 Advanced Configuration

### Customizing Issue Templates

To modify or add new templates:

1. Edit files in `.github/ISSUE_TEMPLATE/`
2. Each template should have YAML frontmatter with metadata:
   ```yaml
   ---
   name: Custom Template
   about: Description of the template
   title: '[CUSTOM] '
   labels: ['custom', 'needs-triage']
   assignees: []
   ---
   ```

### Modifying GitHub Actions Workflow

Edit `.github/workflows/auto-issues.yml` to:
- Add new triggers
- Modify issue creation logic
- Change labels or assignees
- Add custom issue types

### Environment Configuration

```bash
# Set for current session
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxx
export GITHUB_OWNER=your-github-username
export GITHUB_REPO=your-repository-name

# Set in your shell profile for persistence
echo 'export GITHUB_TOKEN=ghp_xxx' >> ~/.bashrc
```

## 📊 Workflow Examples

### Development Workflow with Auto-Issues

```bash
# 1. Work on a feature
git checkout -b feature/new-wallet-feature
# ... make changes ...

# 2. Discover a bug during development
git add .
git commit -m "[BUG] Transaction fails when amount > 100 CELO"

# 3. Add a TODO item for later
git commit -m "[TODO] Add error boundary for wallet components"

# 4. Push to GitHub - triggers automated issue creation
git push origin feature/new-wallet-feature

# 5. Create additional issues manually if needed
node scripts/create-issue.js --interactive
```

### Release Process with Automated Issues

```bash
# 1. Run tests before release
npm run test:run
npm run build

# 2. If tests fail, auto-created issues appear
# 3. Fix issues and commit
git add .
git commit -m "fix: Resolve test failures in CI pipeline"
git push

# 4. Auto-created test failure issues close automatically
```

## 🛠 Troubleshooting

### Common Issues and Solutions

**Issue: CLI script says "Could not load template"**
```bash
# Solution: Run from project root directory
cd /path/to/ship-celo-wallet
node scripts/create-issue.js --interactive
```

**Issue: Authentication errors when creating issues**
```bash
# Check your token has proper permissions
echo $GITHUB_TOKEN
# Should start with ghp_

# Verify token scope (needs 'repo' scope for private repos)
```

**Issue: Workflow doesn't trigger**
```bash
# Check Actions are enabled in repository settings
# Verify workflow file is in .github/workflows/
# Check branch protection rules don't block actions
```

**Issue: Issues are created but not assigned properly**
```bash
# Verify assignee usernames are correct
# Check if repository allows issues assignment
```

### Debug Mode

```bash
# Enable debug output
export DEBUG=issue-creator:*
node scripts/create-issue.js --type bug --title "Test" --description "Test description"
```

### Testing Configuration

```bash
# Test without actually creating issues
node scripts/create-issue.js --type bug --title "Test Issue" --description "This is a test"

# Should show what would be created without GITHUB_TOKEN
```

## 📈 Best Practices

### Commit Message Conventions

Use clear, descriptive commit messages with appropriate prefixes:
- `[BUG]` - Bug fixes and error reports
- `[FEATURE]` - New functionality
- `[ENHANCEMENT]` - Improvements to existing features
- `[DOCS]` - Documentation updates
- `[SECURITY]` - Security-related commits
- `[TODO]` - General tasks and improvements

### Issue Management

1. **Use appropriate templates** for consistent issue quality
2. **Add relevant labels** automatically or manually
3. **Assign issues** to team members for accountability
4. **Update issue status** as work progresses
5. **Close auto-created issues** when resolved

### Team Coordination

1. **Set up repository secrets** for automated workflows
2. **Define team labels** and conventions
3. **Train team members** on commit message conventions
4. **Review created issues** regularly for quality
5. **Archive resolved issues** to keep repository clean

## 🎯 Benefits

This automated system provides:

- **Consistency** - All issues follow same structure and quality
- **Automation** - Less manual work for issue creation
- **Traceability** - Issues linked to commits and branches
- **Quality** - Structured templates ensure complete information
- **Efficiency** - Faster issue creation and management
- **Collaboration** - Better issue tracking for team projects

## 🔗 Related Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Issue Templates Guide](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Conventional Commits](https://www.conventionalcommits.org/)