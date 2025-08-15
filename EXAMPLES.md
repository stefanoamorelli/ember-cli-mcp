# Ember CLI MCP Server - Usage Examples

## Working with Different Directories

### IMPORTANT: Every command supports the `cwd` parameter!

You can run any Ember command in a specific directory by adding the `cwd` parameter:

### Run tests in a specific project
```json
{
  "tool": "ember_test",
  "arguments": {
    "filter": "authentication",
    "cwd": "/home/user/projects/my-ember-app"
  }
}
```

### Build a project in another directory
```json
{
  "tool": "ember_build",
  "arguments": {
    "environment": "production",
    "cwd": "/home/user/projects/frontend"
  }
}
```

### Start dev server for a specific project
```json
{
  "tool": "ember_serve",
  "arguments": {
    "port": 4200,
    "cwd": "/home/user/workspace/ember-project"
  }
}
```

### Generate component in a specific project
```json
{
  "tool": "ember_generate",
  "arguments": {
    "blueprint": "component",
    "name": "user-card",
    "typescript": true,
    "cwd": "/path/to/your/ember/project"
  }
}
```

### Get info about a specific project
```json
{
  "tool": "ember_project_info",
  "arguments": {
    "cwd": "/home/user/projects/my-app"
  }
}
```

### Install addon in a specific project
```json
{
  "tool": "ember_install",
  "arguments": {
    "addon_name": "ember-power-select",
    "cwd": "/home/user/projects/my-app"
  }
}
```

## Test Command with Filters

### Filter tests by name pattern
```json
{
  "tool": "ember_test",
  "arguments": {
    "filter": "should render the component",
    "reporter": "dot"
  }
}
```

### Filter tests by module
```json
{
  "tool": "ember_test",
  "arguments": {
    "module": "Unit | Service | authentication",
    "reporter": "tap"
  }
}
```

### Combine module and filter
```json
{
  "tool": "ember_test",
  "arguments": {
    "module": "Integration | Component",
    "filter": "user-profile",
    "launch": "Chrome,Firefox"
  }
}
```

### Run tests in server mode with specific port
```json
{
  "tool": "ember_test",
  "arguments": {
    "server": true,
    "test_port": 8080,
    "filter": "acceptance"
  }
}
```

### Use raw command for complex filtering
```json
{
  "tool": "ember_run_command",
  "arguments": {
    "command": "test --filter=\"should.*render\" --module=\"Component\" --reporter=xunit"
  }
}
```

## Generate Commands with TypeScript

### Generate TypeScript component
```json
{
  "tool": "ember_generate",
  "arguments": {
    "blueprint": "component",
    "name": "user-avatar",
    "typescript": true
  }
}
```

### Generate service with tests
```json
{
  "tool": "ember_generate",
  "arguments": {
    "blueprint": "service",
    "name": "notifications",
    "typescript": true
  }
}
```

## Build & Serve Commands

### Serve with proxy and custom port
```json
{
  "tool": "ember_serve",
  "arguments": {
    "port": 3000,
    "proxy": "https://api.example.com",
    "environment": "development"
  }
}
```

### Production build with watch
```json
{
  "tool": "ember_build",
  "arguments": {
    "environment": "production",
    "watch": true,
    "output_path": "dist-prod/"
  }
}
```

## Create New Apps

### Create TypeScript app with Embroider
```json
{
  "tool": "ember_new",
  "arguments": {
    "app_name": "my-modern-app",
    "typescript": true,
    "embroider": true,
    "strict": true,
    "package_manager": "pnpm"
  }
}
```

## Complex Test Scenarios

### Run specific acceptance tests
```json
{
  "tool": "ember_run_command",
  "arguments": {
    "command": "test --filter=\"Acceptance | User Flow\" --launch=Chrome --test-page=tests/index.html?hidepassed"
  }
}
```

### Run tests with custom query parameters
```json
{
  "tool": "ember_test",
  "arguments": {
    "filter": "authentication",
    "query": "grep=login&invert=true",
    "reporter": "xunit",
    "output_path": "test-results/"
  }
}
```

### Debug specific test module
```json
{
  "tool": "ember_test",
  "arguments": {
    "module": "Unit | Utility | format-date",
    "testem_debug": "testem.log",
    "launch": "Chrome"
  }
}
```

## Installation & Package Management

### Install addon with exact version
```json
{
  "tool": "ember_install",
  "arguments": {
    "addon_name": "ember-power-select",
    "save_exact": true,
    "package_manager": "yarn"
  }
}
```

## Project Information

### Get project info
```json
{
  "tool": "ember_project_info",
  "arguments": {}
}
```

### List all addons
```json
{
  "tool": "ember_list_addons",
  "arguments": {}
}
```

### List available blueprints
```json
{
  "tool": "ember_list_blueprints",
  "arguments": {}
}
```

## Advanced Usage

### Run any Ember CLI command
The `ember_run_command` tool allows you to run ANY Ember CLI command with ANY flags:

```json
{
  "tool": "ember_run_command",
  "arguments": {
    "command": "test --silent --filter=\"Integration.*Component\" --module=\"user\" --launch=Chrome,Firefox --reporter=dot --output-path=coverage/"
  }
}
```

This gives you complete flexibility to use any Ember CLI feature, even ones that might be added in future versions!