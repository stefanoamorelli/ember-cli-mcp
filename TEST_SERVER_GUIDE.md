# Running Ember Test Server with Claude Code MCP

This guide shows how to run a persistent Ember test server in the background and execute individual tests using Claude Code.

## Overview

The `ember-cli-mcp` server supports running long-running commands like `ember test --server` which keeps a test server running in the background. You can then run individual tests against this server for faster feedback.

## Method 1: Using ember_test with server option

### Start the test server:
```
"Run ember test server in the background and keep it running"
```

Claude will use:
```javascript
ember_test({ server: true })
```

This starts `ember test --server` and returns a process ID.

### Run specific tests:
```
"Run only the acceptance tests for the login feature"
```

Claude will use:
```javascript
ember_test({ 
  filter: "login",
  module: "Acceptance"
})
```

### Run tests by file pattern:
```
"Run all unit tests for services"
```

Claude will use:
```javascript
ember_test({ 
  filter: "Unit | Service"
})
```

## Method 2: Using ember_run_command for custom test commands

### Start test server with custom options:
```
"Start ember test server on port 7359 with specific reporter"
```

Claude will use:
```javascript
ember_run_command({ 
  command: "test --server --port 7359 --reporter dot"
})
```

### Run focused tests:
```
"Run only the test 'should validate email format'"
```

Claude will use:
```javascript
ember_run_command({ 
  command: "test --filter='should validate email format'"
})
```

## Method 3: Managing background processes

### List running servers:
```
"Show me all running ember servers"
```

Claude will use `ember_project_info` to check running processes.

### Stop a test server:
```
"Stop the ember test server"
```

Claude will use:
```javascript
ember_stop_server({ type: "test" })
```

## Example Workflow Prompts

### Complete TDD workflow:

1. **Start test server:**
   ```
   "Start ember test server in watch mode for TDD"
   ```

2. **Create a new test:**
   ```
   "Generate a new integration test for the user-profile component"
   ```

3. **Run the specific test:**
   ```
   "Run only the user-profile component integration test"
   ```

4. **Fix failing test:**
   ```
   "The test is failing because the component is missing. Create the user-profile component"
   ```

5. **Re-run test:**
   ```
   "Run the user-profile test again"
   ```

6. **Run related tests:**
   ```
   "Run all component integration tests to make sure nothing broke"
   ```

7. **Stop server when done:**
   ```
   "Stop the test server, I'm done with TDD"
   ```

## Advanced Test Patterns

### Parallel test execution:
```
"Run ember tests in parallel with 4 workers"
```

Claude will use:
```javascript
ember_run_command({ 
  command: "exam --parallel 4"
})
```

### Test with coverage:
```
"Run tests with code coverage report"
```

Claude will use:
```javascript
ember_run_command({ 
  command: "test --coverage"
})
```

### Debug mode:
```
"Run tests in debug mode for the authentication service"
```

Claude will use:
```javascript
ember_test({ 
  filter: "authentication",
  launch: "Chrome",
  server: true
})
```

### Watch specific module:
```
"Watch and re-run only the model tests when files change"
```

Claude will use:
```javascript
ember_test({ 
  module: "Unit | Model",
  server: true
})
```

## Tips for Claude Code Usage

1. **Be specific about what you want:**
   - ❌ "Run tests"
   - ✅ "Run only the unit tests for the user model"

2. **Use descriptive filters:**
   - ❌ "Test the login"
   - ✅ "Run all tests containing 'login' in acceptance and integration tests"

3. **Specify test organization:**
   - ✅ "Run all tests in the 'Unit | Service' module"
   - ✅ "Run acceptance tests for the checkout flow"

4. **Combine operations:**
   - ✅ "Start a test server and then run only the failing tests from the last run"

5. **Use test selectors:**
   - ✅ "Run the test with description 'should handle empty state'"
   - ✅ "Run all tests in the file tests/integration/components/user-list-test.js"

## Performance Tips

1. **Keep test server running:** Starting `ember test --server` once and running individual tests is much faster than running `ember test` repeatedly.

2. **Use focused testing:** Run only the tests you're working on using filters and modules.

3. **Parallel execution:** For large test suites, use `ember exam --parallel` for faster execution.

4. **Watch mode:** Use server mode to automatically re-run tests when files change.

## Common Issues and Solutions

### Issue: Test server port conflict
**Solution:** 
```
"Start test server on port 7360 instead of the default"
```

### Issue: Tests timing out
**Solution:**
```
"Run tests with extended timeout of 10000ms"
```

### Issue: Need to debug a specific test
**Solution:**
```
"Run the failing user-auth test in Chrome with debugging enabled"
```

## Integration with Development Workflow

You can combine test server with development server:

```
"Start both the dev server on port 4200 and test server on port 7357"
```

Then:
```
"Run acceptance tests while keeping the dev server running"
```

This allows you to:
- Browse your app at http://localhost:4200
- Run tests at http://localhost:7357
- Have both update automatically on file changes