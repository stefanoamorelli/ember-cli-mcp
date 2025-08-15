# ember-cli-mcp

[![npm version](https://badge.fury.io/js/ember-cli-mcp.svg)](https://www.npmjs.com/package/ember-cli-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io)

Allow [MCP](https://modelcontextprotocol.io) clients like [Claude Code](https://docs.anthropic.com/en/docs/claude-code) to run [Ember CLI](https://ember-cli.com) commands directly in your projects.

## What is this?

This MCP server lets any MCP client (like [Claude Code](https://docs.anthropic.com/en/docs/claude-code)) execute [Ember CLI](https://ember-cli.com) commands. No more copy-pasting commands or switching between terminals - just ask Claude to run your tests, generate components, or build your app.

## Quick Start

### With [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

Install globally first:
```bash
npm install -g ember-cli-mcp
claude mcp add ember-cli -s user -- ember-cli-mcp
```

### Manual Configuration

If you prefer to configure manually, add to your MCP settings:
```json
{
  "ember-cli": {
    "command": "npx",
    "args": ["ember-cli-mcp"]
  }
}
```

That's it. Now you can tell Claude: "run my tests" or "generate a component called user-card".

## Key Features

### Test Filtering

Run specific tests with powerful filtering options:

| Option | Description | Example |
|--------|-------------|---------|
| `filter` | Filter by test name | `"authentication"` |
| `module` | Filter by module | `"Unit \| Service"` |
| `launch` | Browser selection | `"Chrome,Firefox"` |
| `reporter` | Output format | `"tap"`, `"dot"`, `"xunit"` |
| `server` | Keep running | `true` |
| `silent` | Hide output | `true` |

Example:
```javascript
ember_test({ 
  filter: "authentication",
  module: "Unit | Service",
  cwd: "/path/to/your/project"
})
```

## All Commands

| Command | Description |
|---------|-------------|
| `ember_new` | Create new apps |
| `ember_serve` | Start dev server |
| `ember_build` | Build for production |
| `ember_test` | Run tests (with filters!) |
| `ember_generate` | Generate components, routes, services, etc. |
| `ember_destroy` | Remove generated code |
| `ember_install` | Install addons |
| `ember_project_info` | Get project details |
| `ember_list_addons` | See installed addons |
| `ember_list_blueprints` | Available blueprints |
| `ember_run_command` | Run any Ember CLI command |

Every command supports the `cwd` parameter to work with different projects.

## Examples

Ask Claude things like:

- "Run the authentication tests"
- "Generate a TypeScript service called notifications"
- "Build my app for production"
- "What addons are installed?"
- "Start the dev server on port 3000"

Claude will use the MCP server to actually run these commands in your project.

## Working with Multiple Projects

Every command accepts a `cwd` parameter:

```javascript
// Test project A
ember_test({ 
  filter: "user",
  cwd: "/projects/app-a"
})

// Build project B
ember_build({
  environment: "production",
  cwd: "/projects/app-b"
})
```

## Blueprints

All 40+ [Ember](https://emberjs.com) blueprints are supported:

| Category | Blueprints |
|----------|------------|
| **Components** | component, component-class, component-test, template |
| **Routes** | route, controller, route-test, controller-test |
| **Services** | service, helper, service-test, helper-test |
| **Data** | model, adapter, serializer, transform |
| **Tests** | acceptance-test, integration-test, unit-test |
| **Utilities** | util, mixin, initializer, instance-initializer |
| **Infrastructure** | addon, lib, server, blueprint |

## Installation from Source

If you want to hack on this:

```bash
git clone https://github.com/stefanoamorelli/ember-cli-mcp.git
cd ember-cli-mcp
npm install
npm run build
npm link
```

## Requirements

- [Node.js](https://nodejs.org) 18+
- [Ember CLI](https://ember-cli.com) (in your project or globally)

## Contributing

Found a bug? Want a feature? PRs welcome!

## License

MIT © 2025 [Stefano Amorelli](https://amorelli.tech)