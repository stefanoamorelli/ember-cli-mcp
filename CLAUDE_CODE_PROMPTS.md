# Claude Code Prompts for Ember CLI MCP

## Quick Test Server Setup

### Basic Usage - Start Test Server and Run Tests

**Prompt 1: Start persistent test server**
```
Using the ember-cli MCP, start an ember test server in the background that stays running
```

**Prompt 2: Run specific test**
```
Using the ember-cli MCP, run only the test named "should validate user email" against the running test server
```

**Prompt 3: Run tests by module**
```
Using the ember-cli MCP, run all the unit tests for services
```

## Complete Example Prompts

### TDD Workflow
```
Using ember-cli MCP:
1. Start ember test --server in the background
2. Generate an integration test for a component called user-avatar
3. Run only that new test to see it fail
4. Tell me what I need to implement
```

### Focused Testing
```
Using ember-cli MCP, I want to do TDD:
- Keep a test server running
- Run only tests matching "authentication" 
- Show me the output
```

### Test Debugging
```
Using ember-cli MCP:
- Start test server with Chrome debugging enabled
- Run the failing test "should handle logout"
- Keep the browser open for debugging
```

## Specific Command Examples

### Run test server on custom port
```
Using ember-cli MCP, run: ember test --server --port 7360
```

### Run filtered tests
```
Using ember-cli MCP, run tests matching pattern "Unit | Model | user"
```

### Run with coverage
```
Using ember-cli MCP, run: ember test --coverage
```

### Parallel test execution
```
Using ember-cli MCP, run: ember exam --parallel 4
```

## Managing Background Processes

### Check running servers
```
Using ember-cli MCP, show me all running ember processes
```

### Stop test server
```
Using ember-cli MCP, stop the ember test server
```

### Restart test server
```
Using ember-cli MCP:
1. Stop any running test servers
2. Start a fresh test server on port 7357
```

## Advanced Workflows

### Full TDD Cycle
```
I want to add a new feature using TDD with ember-cli MCP:
1. Start a persistent test server
2. Create a test file for a "payment-processor" service
3. Run the test (it should fail)
4. Generate the service
5. Run the test again
6. Implement the service until tests pass
```

### Continuous Testing
```
Using ember-cli MCP:
- Start test server in watch mode
- Whenever I save a file, run related tests automatically
- Keep the server running until I say stop
```

### Test and Development Together
```
Using ember-cli MCP:
1. Start dev server on port 4200
2. Start test server on port 7357
3. Both should run in background
4. Run acceptance tests for the current feature I'm working on
```

## Tips for Best Results

1. **Be explicit about MCP usage:**
   Always start with "Using ember-cli MCP" or "Using the ember-cli MCP tool"

2. **Specify background/persistent:**
   Use words like "keep running", "in the background", "persistent", "don't stop"

3. **Be specific about test selection:**
   - "tests matching [pattern]"
   - "only the test named [name]"
   - "all tests in module [module]"
   - "tests in file [path]"

4. **Chain operations clearly:**
   Number your steps or use "then", "after that", "next"

5. **Specify ports when needed:**
   Default test port is 7357, specify if you need different

## Common Patterns

### Quick test run
```
ember-cli MCP: run just the failing tests from last run
```

### Test watching
```
ember-cli MCP: watch and run unit tests for models when they change
```

### Acceptance testing
```
ember-cli MCP: run all acceptance tests for the checkout flow
```

### Component testing
```
ember-cli MCP: test all components matching "ui-"
```

### Service testing
```
ember-cli MCP: run service tests in isolation
```

## Troubleshooting Prompts

### If test server won't start
```
Using ember-cli MCP:
1. Check if any ember process is running
2. Stop all ember processes
3. Start fresh test server on port 7360
```

### If tests are slow
```
Using ember-cli MCP, run tests in parallel with 4 workers using ember exam
```

### If you need debug output
```
Using ember-cli MCP, run tests with verbose output and show me the full log
```