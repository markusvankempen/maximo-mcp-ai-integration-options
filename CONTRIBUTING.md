# Contributing to Maximo MCP Server

First off, thank you for considering contributing to the Maximo MCP Server! 

The `maximo-mcp-server` project is an open-source initiative to enable AI-driven development for IBM Maximo. We welcome contributions from the community to help make this tool even better.

## 🛠 Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: JavaScript (CommonJS) / ES6+
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Key Libraries**:
  - `@modelcontextprotocol/sdk`: The core MCP implementation
  - `express`: For the local proxy server
  - `zod`: For schema validation

---

## 🚀 Environment Setup

We use `mise` (or standard Node managers) to ensure a consistent environment.

1.  **Fork and Clone**
    ```bash
    git clone https://github.com/your-username/Maximo-MCP-EDF.git
    cd Maximo-MCP-EDF
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Copy the example configuration:
    ```bash
    cp .env.example .env
    ```
    Edit `.env` with your development keys. **Note**: For tests, we use mocked data, so a live connection isn't always strictly required for unit testing.

---

## 🧪 Development Workflow

### Coding Standards

We enforce code quality using **ESLint** and **Prettier**.

*   **Linting**: checks for code errors and best practices.
*   **Formatting**: ensures consistent style (indentation, quotes, etc.).

**VS Code**: Install the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions to auto-fix issues on save.

### Running Checks

Before submitting a PR, run the following commands to ensure your code is clean:

```bash
# Format code
npm run format

# Run linting
npm run lint

# Run unit tests
npm test
```

---

## 📜 Pull Request Process

1.  **Branching**: Create a feature branch for your changes (`feature/new-tool`, `fix/schema-bug`).
2.  **Commit Messages**: Please use clear, descriptive commit messages.
3.  **Documentation**: If you change functionality, update the relevant `docs/` files and `README.md`.
4.  **Tests**: Add unit tests for any new logic.
5.  **Review**: Open a Pull Request (PR) against the `main` branch.

---

## 🧪 Testing Guidelines

We use **Jest** for testing.

*   **Unit Tests**: Located in `__tests__` or alongside source files as `*.test.js`.
*   **Integration Tests**: Test the full MCP server flow (mocking Maximo API responses).

**Example Test:**
```javascript
test('should validate object structure name', () => {
  const result = isValidObjectStructure('MXWO');
  expect(result).toBe(true);
});
```

---

## ❓ Getting Help

If you have questions, feel free to open a [GitHub Issue](https://github.com/markusvankempen/maximo-mcp-ai-integration-options/issues) or reach out via the contact information in `README.md`.

Happy Coding! 🚀
