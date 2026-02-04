# Contributing to AstroDash

Thank you for your interest in contributing to AstroDash! This document provides guidelines and instructions for contributing.

## 🌟 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔌 Create new cards/plugins
- 🧪 Write tests
- 🎨 Improve UI/UX
- 🌍 Add translations

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/astrodash.git
cd astrodash
```

### 2. Set Up Development Environment

```bash
# Install dependencies
cd backend
npm install
cd ..

# Copy environment template
cp backend/.env.example backend/.env

# Start development server
docker compose -f docker-compose.dev.yml up
```

### 3. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/my-new-feature

# Or a bugfix branch
git checkout -b fix/bug-description
```

## 📝 Development Guidelines

### Code Style

- Use **2 spaces** for indentation
- Use **camelCase** for variables and functions
- Use **PascalCase** for classes and components
- Add **comments** for complex logic
- Keep functions **small and focused**

### Commit Messages

Write clear, descriptive commit messages:

```bash
# Good
git commit -m "Add ISS tracking card with real-time updates"
git commit -m "Fix moon phase calculation for southern hemisphere"
git commit -m "Update README with deployment instructions"

# Bad
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "wip"
```

### Pull Request Process

1. **Update your branch** with latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Test your changes**:
   ```bash
   # Make sure everything works
   docker compose -f docker-compose.dev.yml up
   # Test the specific feature you changed
   ```

3. **Create Pull Request**:
   - Go to GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the template (see below)

4. **Address review comments**:
   - Make requested changes
   - Push updates to your branch
   - Respond to reviewer feedback

### Pull Request Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature (card/plugin)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
How did you test this?
- [ ] Tested locally
- [ ] Tested on staging
- [ ] Added automated tests

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Tested thoroughly
```

## 🔌 Creating New Cards

Cards are the modular features of AstroDash. Here's how to create one:

### 1. Card Structure

```
cards/my-card/
├── manifest.json          # Card metadata
├── README.md             # Card documentation
├── backend/
│   ├── service.js        # Business logic
│   ├── routes.js         # API endpoints
│   └── tests/            # Backend tests
└── frontend/
    ├── MyCard.jsx        # React component
    ├── styles.css        # Styling
    └── tests/            # Frontend tests
```

### 2. Manifest File

```json
{
  "id": "my-card",
  "version": "1.0.0",
  "name": "My Card",
  "description": "What this card does",
  "author": "Your Name",
  "category": "astronomy|weather|equipment|logging",
  "enabled": true,
  "permissions": ["location", "api"],
  "settings": {
    "updateInterval": 3600,
    "configurable": true
  }
}
```

### 3. Backend Service Example

```javascript
// cards/my-card/backend/service.js
class MyCardService {
  async getData(userId, params) {
    // Implement your logic
    // Access database, call APIs, process data
    
    return {
      success: true,
      data: { /* your data */ }
    };
  }
}

module.exports = new MyCardService();
```

### 4. Backend Routes Example

```javascript
// cards/my-card/backend/routes.js
const express = require('express');
const router = express.Router();
const service = require('./service');
const { authenticateToken } = require('../../../src/middleware/auth');

// Public endpoint
router.get('/my-card/public', async (req, res) => {
  try {
    const data = await service.getData(null, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Protected endpoint (requires login)
router.get('/my-card/private', authenticateToken, async (req, res) => {
  try {
    const data = await service.getData(req.user.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 5. Frontend Component Example

```javascript
// cards/my-card/frontend/MyCard.jsx
function MyCard({ config, userSettings }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const response = await fetch('/api/cards/my-card/public');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="card loading">Loading...</div>;

  return (
    <div className="card my-card">
      <h3>{config.name}</h3>
      <div className="card-content">
        {/* Your card UI here */}
      </div>
    </div>
  );
}
```

## 🌍 Adding Translations

We support multiple languages! To add a new language:

### 1. Create Translation File

```bash
# Copy English template
cp frontend/public/locales/en.json frontend/public/locales/YOUR_LANG.json
```

### 2. Translate Content

```json
{
  "header": {
    "title": "AstroDash",
    "tagline": "Your translated tagline here"
  },
  "search": {
    "cityTab": "Your translation",
    ...
  }
}
```

### 3. Add Language to Selector

Edit `frontend/public/index.html`:
```html
<select id="languageSelect">
  <option value="en">English</option>
  <option value="de">Deutsch</option>
  <option value="YOUR_LANG">Your Language</option>
</select>
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check [existing issues](https://github.com/YOUR_USERNAME/astrodash/issues)
2. Try the latest version
3. Gather information about the bug

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. Ubuntu 22.04]
- Browser: [e.g. Chrome 120]
- AstroDash version: [e.g. 1.2.0]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives**
Any alternative solutions you've considered.

**Additional context**
Mockups, examples, or other context.
```

## ✅ Code Review Checklist

Before submitting your PR, check:

- [ ] Code follows project style guidelines
- [ ] All tests pass (if applicable)
- [ ] Documentation updated (README, API docs, etc.)
- [ ] No console.log() or debug code left
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## 📚 Resources

- [Project Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Card Development Guide](docs/CARDS.md)
- [Testing Guide](docs/TESTING.md)

## 🤔 Questions?

- Open a [Discussion](https://github.com/YOUR_USERNAME/astrodash/discussions)
- Check [existing issues](https://github.com/YOUR_USERNAME/astrodash/issues)
- Email: dev@astrodash.ch

## 🎉 Recognition

Contributors will be:
- Listed in README
- Credited in release notes
- Appreciated by the astronomy community!

---

**Thank you for contributing to AstroDash!** 🌟

Clear skies and happy coding! 🔭
