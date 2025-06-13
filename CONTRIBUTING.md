# Contributing to Casa dos Escritores

## Overview

We welcome contributions to Casa dos Escritores. This document provides guidelines for contributing to the project effectively and maintaining code quality standards.

## Development Environment

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/your-org/casa-dos-escritores.git
cd casa-dos-escritores

# Install dependencies
npm install

# Configure environment variables
cp env-template.txt .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## Code Standards

### Style Guide
- **JavaScript**: ES6+ features, arrow functions preferred
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **File Naming**: kebab-case for files, PascalCase for components

### Code Quality
- ESLint configuration enforced
- TypeScript for type safety where applicable
- Consistent formatting with project standards
- Comprehensive error handling

### Component Structure
```javascript
// Component template
import { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Effect logic
  }, []);

  const handleEvent = () => {
    // Event handler logic
  };

  return (
    <div className="container mx-auto">
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

## Contribution Workflow

### Branch Naming
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(auth): add two-factor authentication
fix(api): resolve rate limiting issues
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(components): extract common utilities
test(api): add endpoint validation tests
```

### Pull Request Process
1. **Fork** the repository
2. **Create** a feature branch from `main`
3. **Implement** changes with tests
4. **Lint** and test your code
5. **Update** documentation if needed
6. **Submit** pull request with detailed description

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes introduced
```

## Testing

### Test Types
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: User workflow testing (planned)

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test ComponentName.test.js
```

### Test Writing Guidelines
- Test file naming: `ComponentName.test.js`
- Descriptive test names
- Test both happy path and error cases
- Mock external dependencies appropriately

## Database Changes

### Migration Process
1. **Create** migration file in `/migrations`
2. **Test** migration locally
3. **Document** schema changes
4. **Update** TypeScript types if needed

### Schema Guidelines
- Use descriptive table and column names
- Implement proper foreign key constraints
- Add appropriate indexes for performance
- Include Row Level Security (RLS) policies

## API Development

### Endpoint Standards
- RESTful API design principles
- Consistent response format
- Proper HTTP status codes
- Comprehensive error handling

### API Response Format
```javascript
// Success response
{
  success: true,
  data: {...},
  message: "Operation completed successfully"
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input parameters",
    details: {...}
  }
}
```

### Security Requirements
- Authentication required for protected endpoints
- Input validation on all parameters
- Rate limiting implementation
- Sanitization of user inputs

## Documentation

### Code Documentation
- JSDoc comments for complex functions
- README updates for new features
- API endpoint documentation
- Database schema documentation

### Documentation Standards
- Clear, concise language
- Code examples where applicable
- Up-to-date information
- Professional tone

## Performance Considerations

### Frontend Performance
- Optimize component re-renders
- Implement proper loading states
- Use Next.js Image component for images
- Minimize bundle size

### Backend Performance
- Optimize database queries
- Implement appropriate caching
- Use pagination for large datasets
- Monitor API response times

## Security Guidelines

### Development Security
- Never commit sensitive information
- Use environment variables for configuration
- Validate all user inputs
- Implement proper error handling

### Code Review Security
- Check for potential security vulnerabilities
- Verify input validation implementation
- Review authentication/authorization logic
- Ensure sensitive data protection

## Issue Reporting

### Bug Reports
Include the following information:
- Environment details (OS, browser, Node.js version)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages
- Relevant code snippets

### Feature Requests
- Clear description of the proposed feature
- Use cases and benefits
- Implementation suggestions (if any)
- Priority level assessment

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help other contributors
- Maintain professional communication

### Communication Channels
- GitHub Issues for bug reports and feature requests
- Pull Request discussions for code reviews
- Email for security-related concerns

## Release Process

### Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Tagged releases on GitHub
- Changelog maintenance
- Migration guides for breaking changes

### Deployment Process
1. **Testing**: All tests pass in CI/CD
2. **Review**: Code review and approval
3. **Staging**: Deploy to staging environment
4. **Production**: Deploy to production with monitoring

---

**Questions?** Open an issue or contact the development team.

**Thank you for contributing to Casa dos Escritores!** 