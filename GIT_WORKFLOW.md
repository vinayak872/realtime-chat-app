# Real-Time Chat Application - Git Workflow

## How to Use This Project

### 1. Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd real-time-chat-application

# Run setup script
chmod +x setup.sh
./setup.sh
```

### 2. Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Test locally

# Commit changes
git add .
git commit -m "feat: describe your changes"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### 3. Git Ignore

Already configured to exclude:
- `node_modules/`
- `.env` files
- `dist/` builds
- `uploads/` files
- Log files
- OS files (.DS_Store, etc.)

## Common Git Commands

### View Status
```bash
git status
```

### View Logs
```bash
git log --oneline
```

### Undo Changes
```bash
# Unstage file
git reset <file>

# Revert uncommitted changes
git checkout -- <file>

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Branch Management
```bash
# List branches
git branch -a

# Switch branch
git checkout <branch-name>

# Delete local branch
git branch -d <branch-name>

# Delete remote branch
git push origin --delete <branch-name>
```

### Stash Changes
```bash
# Save changes without committing
git stash

# List stashed changes
git stash list

# Apply stashed changes
git stash apply

# Clear stash
git stash clear
```

## Commit Message Convention

Follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: documentation changes
style: code style changes (formatting, semicolons, etc.)
refactor: code refactoring without feature changes
perf: performance improvements
test: add or update tests
chore: maintenance tasks
```

Example:
```bash
git commit -m "feat: add typing indicators to chat"
git commit -m "fix: resolve Socket.IO connection issue"
git commit -m "docs: update README with new features"
```

## Useful Git Aliases

Add to ~/.gitconfig:
```
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --all
```

Then use:
```bash
git st
git co <branch>
git br
```
