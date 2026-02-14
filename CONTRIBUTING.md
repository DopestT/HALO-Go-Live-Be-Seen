# Contributing to HALO

Thank you for your interest in contributing to HALO! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/HALO-Go-Live-Be-Seen.git`
3. Install dependencies: `npm install --legacy-peer-deps`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Coding Standards

### HALO Design Principles

When contributing code to HALO, you **must** follow these strict rules:

1. **Styling:** Use `src/constants/theme.ts`. Never use hard borders or neon colors. Only use rounded geometry (radius: 24).
2. **Components:** Use the `GlassPanel` component for all UI containers to maintain the glassmorphism aesthetic.
3. **Safety:** Every new stream-related feature must include a reference to the `Report` and `Block` utility.
4. **Copy:** Avoid urgent or shame-based language. Use calm, respectful, and authoritative phrasing.
5. **Adult Mode:** Any logic fetching a "feed" must utilize the `filterContentForUser` utility to ensure 18+ content is gated.

### TypeScript

- Use TypeScript for all new code
- Ensure types are properly defined
- Run `npx tsc --noEmit` to check for type errors

### Code Style

- Use consistent formatting (2 spaces for indentation)
- Follow existing code patterns
- Add comments for complex logic
- Use meaningful variable and function names

### React Native

- Use functional components with hooks
- Avoid inline styles when possible
- Use the theme constants for colors and spacing
- Test on both iOS and Android when possible

## Testing

- Write tests for new features
- Ensure all existing tests pass: `npm test`
- Test manually on both platforms when UI is involved

## Commit Messages

Write clear, descriptive commit messages:

```
Add user profile editing feature

- Implement profile edit screen
- Add validation for user inputs
- Update AuthContext with updateUser method
```

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation if needed
3. Add tests for new features
4. Ensure all tests pass
5. Request a code review
6. Address review feedback
7. Wait for approval before merging

## What to Contribute

We welcome contributions in these areas:

- Bug fixes
- New features (discuss in an issue first)
- Documentation improvements
- Test coverage improvements
- Performance optimizations
- UI/UX enhancements (must follow design system)

## Getting Help

- Open an issue for bugs or feature requests
- Tag issues with appropriate labels
- Be patient and respectful when asking for help

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
