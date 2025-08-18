#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import { readdir, stat, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

interface CommandOption {
  name: string;
  type: "string" | "boolean" | "number" | "choice";
  description: string;
  default?: any;
  choices?: string[];
  aliases?: string[];
}

interface EmberCommand {
  name: string;
  description: string;
  aliases?: string[];
  args?: {
    name: string;
    required: boolean;
    description: string;
  }[];
  options: CommandOption[];
}

const EMBER_COMMANDS: EmberCommand[] = [
  {
    name: "new",
    description: "Creates a new directory and runs ember init in it",
    args: [
      { name: "app-name", required: true, description: "Name of the new application" }
    ],
    options: [
      { name: "dry-run", type: "boolean", description: "Show what would be created without actually creating it", default: false, aliases: ["d"] },
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "blueprint", type: "string", description: "Blueprint to use for generating the application", default: "app", aliases: ["b"] },
      { name: "skip-npm", type: "boolean", description: "Skip npm/yarn install", default: false, aliases: ["sn", "skip-install", "si"] },
      { name: "skip-git", type: "boolean", description: "Skip git initialization", default: false, aliases: ["sg"] },
      { name: "welcome", type: "boolean", description: "Install and use ember-welcome-page", default: true },
      { name: "package-manager", type: "choice", choices: ["npm", "pnpm", "yarn"], description: "Package manager to use" },
      { name: "directory", type: "string", description: "Directory to create the app in", aliases: ["dir"] },
      { name: "lang", type: "string", description: "Set the base language of the application" },
      { name: "lint-fix", type: "boolean", description: "Automatically fix linting errors", default: true },
      { name: "embroider", type: "boolean", description: "Use Embroider build system", default: false },
      { name: "ci-provider", type: "choice", choices: ["github", "none"], description: "CI provider to set up" },
      { name: "ember-data", type: "boolean", description: "Include ember-data", default: true },
      { name: "interactive", type: "boolean", description: "Create app interactively", default: false, aliases: ["i"] },
      { name: "typescript", type: "boolean", description: "Set up TypeScript", default: false },
      { name: "strict", type: "boolean", description: "Use GJS/GTS templates by default", default: false }
    ]
  },
  {
    name: "addon",
    description: "Generates a new folder structure for building an addon",
    args: [
      { name: "addon-name", required: true, description: "Name of the new addon" }
    ],
    options: [
      { name: "dry-run", type: "boolean", description: "Show what would be created", default: false, aliases: ["d"] },
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "blueprint", type: "string", description: "Blueprint to use", default: "addon", aliases: ["b"] },
      { name: "skip-npm", type: "boolean", description: "Skip npm/yarn install", default: false, aliases: ["sn", "skip-install", "si"] },
      { name: "skip-git", type: "boolean", description: "Skip git initialization", default: false, aliases: ["sg"] },
      { name: "package-manager", type: "choice", choices: ["npm", "pnpm", "yarn"], description: "Package manager to use" },
      { name: "directory", type: "string", description: "Directory to create the addon in", aliases: ["dir"] },
      { name: "lang", type: "string", description: "Set the base language" },
      { name: "lint-fix", type: "boolean", description: "Automatically fix linting errors", default: true },
      { name: "ci-provider", type: "choice", choices: ["github", "none"], description: "CI provider", default: "github" },
      { name: "typescript", type: "boolean", description: "Use TypeScript", default: false },
      { name: "strict", type: "boolean", description: "Use GJS/GTS templates", default: false }
    ]
  },
  {
    name: "init",
    description: "Reinitializes a new ember-cli project in the current folder",
    args: [
      { name: "glob-pattern", required: false, description: "Glob pattern for files to process" }
    ],
    options: [
      { name: "dry-run", type: "boolean", description: "Show what would be done", default: false, aliases: ["d"] },
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "blueprint", type: "string", description: "Blueprint to use", aliases: ["b"] },
      { name: "skip-npm", type: "boolean", description: "Skip npm/yarn install", default: false, aliases: ["sn", "skip-install", "si"] },
      { name: "lint-fix", type: "boolean", description: "Automatically fix linting errors", default: true },
      { name: "welcome", type: "boolean", description: "Install ember-welcome-page", default: true },
      { name: "package-manager", type: "choice", choices: ["npm", "pnpm", "yarn"], description: "Package manager" },
      { name: "name", type: "string", description: "Name of the project", aliases: ["n"] },
      { name: "lang", type: "string", description: "Set the base language" },
      { name: "embroider", type: "boolean", description: "Use Embroider", default: false },
      { name: "ci-provider", type: "choice", choices: ["github", "none"], description: "CI provider", default: "github" },
      { name: "ember-data", type: "boolean", description: "Include ember-data", default: true },
      { name: "typescript", type: "boolean", description: "Use TypeScript", default: false },
      { name: "strict", type: "boolean", description: "Use GJS/GTS templates", default: false }
    ]
  },
  {
    name: "serve",
    description: "Builds and serves your app, rebuilding on file changes",
    aliases: ["server", "s"],
    options: [
      { name: "port", type: "number", description: "Port to serve on", default: 4200, aliases: ["p"] },
      { name: "host", type: "string", description: "Host to listen on", aliases: ["H"] },
      { name: "proxy", type: "string", description: "Proxy requests to this URL", aliases: ["pr", "pxy"] },
      { name: "proxy-in-timeout", type: "number", description: "Timeout for incoming proxy requests (ms)", default: 120000, aliases: ["pit"] },
      { name: "proxy-out-timeout", type: "number", description: "Timeout for outgoing proxy requests (ms)", default: 0, aliases: ["pot"] },
      { name: "secure-proxy", type: "boolean", description: "Validate SSL certificates when proxying", default: true, aliases: ["spr"] },
      { name: "transparent-proxy", type: "boolean", description: "Include x-forwarded headers when proxying", default: true, aliases: ["transp"] },
      { name: "watcher", type: "string", description: "File watcher to use", default: "events", aliases: ["w"] },
      { name: "live-reload", type: "boolean", description: "Enable live reload", default: true, aliases: ["lr"] },
      { name: "live-reload-host", type: "string", description: "Live reload host", aliases: ["lrh"] },
      { name: "live-reload-base-url", type: "string", description: "Live reload base URL", aliases: ["lrbu"] },
      { name: "live-reload-port", type: "number", description: "Live reload port", aliases: ["lrp"] },
      { name: "live-reload-prefix", type: "string", description: "Live reload prefix", default: "_lr", aliases: ["lrprefix"] },
      { name: "environment", type: "choice", choices: ["development", "production", "test"], description: "Environment", default: "development", aliases: ["e"] },
      { name: "output-path", type: "string", description: "Output directory", default: "dist/", aliases: ["op", "out"] },
      { name: "ssl", type: "boolean", description: "Use SSL", default: false },
      { name: "ssl-key", type: "string", description: "SSL private key", default: "ssl/server.key" },
      { name: "ssl-cert", type: "string", description: "SSL certificate", default: "ssl/server.crt" },
      { name: "path", type: "string", description: "Reuse existing build at path" }
    ]
  },
  {
    name: "build",
    description: "Builds your app and places it into the output path",
    aliases: ["b"],
    options: [
      { name: "environment", type: "choice", choices: ["development", "production", "test"], description: "Build environment", default: "development", aliases: ["e", "dev", "prod"] },
      { name: "output-path", type: "string", description: "Output directory", default: "dist/", aliases: ["o"] },
      { name: "watch", type: "boolean", description: "Watch for changes and rebuild", default: false, aliases: ["w"] },
      { name: "watcher", type: "string", description: "File watcher to use" },
      { name: "suppress-sizes", type: "boolean", description: "Suppress file size output", default: false }
    ]
  },
  {
    name: "test",
    description: "Runs your app's test suite",
    aliases: ["t"],
    options: [
      { name: "environment", type: "string", description: "Test environment", default: "test", aliases: ["e"] },
      { name: "config-file", type: "string", description: "Testem config file", aliases: ["c", "cf"] },
      { name: "server", type: "boolean", description: "Run tests in server mode", default: false, aliases: ["s"] },
      { name: "host", type: "string", description: "Test server host", aliases: ["H"] },
      { name: "test-port", type: "number", description: "Test server port", default: 7357, aliases: ["tp"] },
      { name: "filter", type: "string", description: "Filter tests by name", aliases: ["f"] },
      { name: "module", type: "string", description: "Filter tests by module", aliases: ["m"] },
      { name: "watcher", type: "string", description: "File watcher to use", default: "events", aliases: ["w"] },
      { name: "launch", type: "string", description: "Browsers to launch (comma-separated)" },
      { name: "reporter", type: "choice", choices: ["tap", "dot", "xunit"], description: "Test reporter", aliases: ["r"] },
      { name: "silent", type: "boolean", description: "Suppress output except test report", default: false },
      { name: "ssl", type: "boolean", description: "Use SSL", default: false },
      { name: "ssl-key", type: "string", description: "SSL private key", default: "ssl/server.key" },
      { name: "ssl-cert", type: "string", description: "SSL certificate", default: "ssl/server.crt" },
      { name: "testem-debug", type: "string", description: "Debug log file for testem" },
      { name: "test-page", type: "string", description: "Test page to use" },
      { name: "path", type: "string", description: "Reuse existing build at path" },
      { name: "query", type: "string", description: "Query string to append to test page URL" },
      { name: "output-path", type: "string", description: "Output directory", aliases: ["o"] }
    ]
  },
  {
    name: "generate",
    description: "Generates new code from blueprints",
    aliases: ["g"],
    args: [
      { name: "blueprint", required: true, description: "Blueprint to generate" },
      { name: "name", required: false, description: "Name for the generated code" }
    ],
    options: [
      { name: "dry-run", type: "boolean", description: "Show what would be generated", default: false, aliases: ["d"] },
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "pod", type: "boolean", description: "Use pod structure", default: false, aliases: ["p", "pods"] },
      { name: "classic", type: "boolean", description: "Use classic structure", default: false, aliases: ["c"] },
      { name: "dummy", type: "boolean", description: "Generate in dummy app", default: false, aliases: ["dum", "id"] },
      { name: "in-repo-addon", type: "string", description: "Generate in in-repo addon", aliases: ["in-repo", "ir"] },
      { name: "lint-fix", type: "boolean", description: "Automatically fix linting", default: true },
      { name: "in", type: "string", description: "Generate in specific path" },
      { name: "typescript", type: "boolean", description: "Generate TypeScript", aliases: ["ts"] }
    ]
  },
  {
    name: "destroy",
    description: "Destroys code generated by generate command",
    aliases: ["d"],
    args: [
      { name: "blueprint", required: true, description: "Blueprint to destroy" },
      { name: "name", required: false, description: "Name of the code to destroy" }
    ],
    options: [
      { name: "dry-run", type: "boolean", description: "Show what would be destroyed", default: false, aliases: ["d"] },
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "pod", type: "boolean", description: "Use pod structure", default: false, aliases: ["p", "pods"] },
      { name: "classic", type: "boolean", description: "Use classic structure", default: false, aliases: ["c"] },
      { name: "dummy", type: "boolean", description: "Destroy in dummy app", default: false, aliases: ["dum", "id"] },
      { name: "in-repo-addon", type: "string", description: "Destroy in in-repo addon", aliases: ["in-repo", "ir"] },
      { name: "in", type: "string", description: "Destroy in specific path" },
      { name: "typescript", type: "boolean", description: "Target TypeScript files", aliases: ["ts"] }
    ]
  },
  {
    name: "install",
    description: "Installs an ember-cli addon from npm",
    aliases: ["i"],
    args: [
      { name: "addon-name", required: true, description: "Name of the addon to install" }
    ],
    options: [
      { name: "save", type: "boolean", description: "Save to dependencies", default: false, aliases: ["S"] },
      { name: "save-dev", type: "boolean", description: "Save to devDependencies", default: true, aliases: ["D"] },
      { name: "save-exact", type: "boolean", description: "Save exact version", default: false, aliases: ["E", "exact"] },
      { name: "package-manager", type: "choice", choices: ["npm", "pnpm", "yarn"], description: "Package manager to use" }
    ]
  },
  {
    name: "asset-sizes",
    description: "Shows the sizes of your asset files",
    options: [
      { name: "output-path", type: "string", description: "Build output path", default: "dist/", aliases: ["o"] },
      { name: "json", type: "boolean", description: "Output as JSON", default: false }
    ]
  },
  {
    name: "version",
    description: "Outputs ember-cli version",
    aliases: ["v", "--version"],
    options: [
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false }
    ]
  },
  {
    name: "help",
    description: "Outputs usage instructions for commands",
    aliases: ["h", "--help"],
    args: [
      { name: "command-name", required: false, description: "Command to get help for" }
    ],
    options: [
      { name: "verbose", type: "boolean", description: "Show verbose output", default: false, aliases: ["v"] },
      { name: "json", type: "boolean", description: "Output as JSON", default: false }
    ]
  }
];

const EMBER_BLUEPRINTS = [
  // Core Ember blueprints
  { name: "component", description: "Generate an Ember component" },
  { name: "component-class", description: "Generate a component class" },
  { name: "component-test", description: "Generate a component test" },
  { name: "route", description: "Generate an Ember route" },
  { name: "route-test", description: "Generate a route test" },
  { name: "controller", description: "Generate an Ember controller" },
  { name: "controller-test", description: "Generate a controller test" },
  { name: "helper", description: "Generate an Ember helper" },
  { name: "helper-test", description: "Generate a helper test" },
  { name: "service", description: "Generate an Ember service" },
  { name: "service-test", description: "Generate a service test" },
  { name: "template", description: "Generate a template" },
  { name: "util", description: "Generate a utility" },
  { name: "util-test", description: "Generate a utility test" },
  { name: "initializer", description: "Generate an initializer" },
  { name: "initializer-test", description: "Generate an initializer test" },
  { name: "instance-initializer", description: "Generate an instance initializer" },
  { name: "instance-initializer-test", description: "Generate an instance initializer test" },
  { name: "mixin", description: "Generate a mixin" },
  { name: "mixin-test", description: "Generate a mixin test" },
  { name: "acceptance-test", description: "Generate an acceptance test" },
  
  // Ember Data blueprints
  { name: "model", description: "Generate an Ember Data model" },
  { name: "model-test", description: "Generate a model test" },
  { name: "adapter", description: "Generate an Ember Data adapter" },
  { name: "adapter-test", description: "Generate an adapter test" },
  { name: "serializer", description: "Generate an Ember Data serializer" },
  { name: "serializer-test", description: "Generate a serializer test" },
  { name: "transform", description: "Generate an Ember Data transform" },
  { name: "transform-test", description: "Generate a transform test" },
  
  // Ember CLI blueprints
  { name: "addon", description: "Generate an addon" },
  { name: "addon-import", description: "Generate an import wrapper" },
  { name: "app", description: "Generate an app" },
  { name: "blueprint", description: "Generate a blueprint" },
  { name: "http-mock", description: "Generate a mock API endpoint" },
  { name: "http-proxy", description: "Generate a proxy configuration" },
  { name: "in-repo-addon", description: "Generate an in-repo addon" },
  { name: "lib", description: "Generate a lib directory" },
  { name: "server", description: "Generate a server directory" }
];

class EmberCliMcpServer {
  private server: Server;
  private runningProcesses: Map<string, any> = new Map();
  private testServerInfo: { port: number; processId: string } | null = null;
  private buildingProjects: Map<string, { started: number; type: string }> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: "ember-cli-mcp",
        version: "0.2.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ...EMBER_COMMANDS.map((cmd) => ({
          name: `ember_${cmd.name}`,
          description: cmd.description,
          inputSchema: {
            type: "object" as const,
            properties: {
              ...((cmd.args || []).reduce((acc, arg) => ({
                ...acc,
                [arg.name.replace(/-/g, "_")]: {
                  type: "string" as const,
                  description: arg.description,
                }
              }), {})),
              ...(cmd.options.reduce((acc, opt) => ({
                ...acc,
                [opt.name.replace(/-/g, "_")]: this.getOptionSchema(opt),
              }), {})),
              cwd: {
                type: "string" as const,
                description: "Working directory to run the command in",
              },
            },
            required: (cmd.args || [])
              .filter(arg => arg.required)
              .map(arg => arg.name.replace(/-/g, "_")),
          },
        })),
        {
          name: "ember_run_command",
          description: "Run any ember command with raw arguments",
          inputSchema: {
            type: "object" as const,
            properties: {
              command: {
                type: "string" as const,
                description: "The ember command to run (e.g., 'test --filter \"my test\"')",
              },
              cwd: {
                type: "string" as const,
                description: "Working directory",
              },
            },
            required: ["command"],
          },
        },
        {
          name: "ember_project_info",
          description: "Get comprehensive information about the current Ember project",
          inputSchema: {
            type: "object" as const,
            properties: {
              cwd: {
                type: "string" as const,
                description: "Project directory",
              },
            },
          },
        },
        {
          name: "ember_list_addons",
          description: "List all installed Ember addons with versions",
          inputSchema: {
            type: "object" as const,
            properties: {
              cwd: {
                type: "string" as const,
                description: "Project directory",
              },
            },
          },
        },
        {
          name: "ember_list_blueprints",
          description: "List all available blueprints for generate/destroy",
          inputSchema: {
            type: "object" as const,
            properties: {
              cwd: {
                type: "string" as const,
                description: "Project directory",
              },
            },
          },
        },
        {
          name: "ember_stop_server",
          description: "Stop a running ember server",
          inputSchema: {
            type: "object" as const,
            properties: {
              process_id: {
                type: "string" as const,
                description: "ID of the server process to stop",
              },
            },
          },
        },
        {
          name: "ember_build_test",
          description: "Build the app for test environment (creates dist/ with test files)",
          inputSchema: {
            type: "object" as const,
            properties: {
              cwd: {
                type: "string" as const,
                description: "Working directory",
              },
              force: {
                type: "boolean" as const,
                description: "Force rebuild even if dist exists",
                default: false,
              },
            },
          },
        },
        {
          name: "ember_test_server_run",
          description: "Run tests using pre-built test files (automatically builds if needed, uses --path to avoid recompilation)",
          inputSchema: {
            type: "object" as const,
            properties: {
              filter: {
                type: "string" as const,
                description: "Test filter pattern to run specific tests",
              },
              module: {
                type: "string" as const,
                description: "Run tests from a specific module",
              },
              cwd: {
                type: "string" as const,
                description: "Working directory",
              },
              reporter: {
                type: "string" as const,
                description: "Test reporter format (tap, dot, xunit)",
                enum: ["tap", "dot", "xunit"],
                default: "tap",
              },
            },
          },
        },
        {
          name: "ember_test_server_start",
          description: "Build app for testing and start a test server for browser-based testing",
          inputSchema: {
            type: "object" as const,
            properties: {
              port: {
                type: "number" as const,
                description: "Port to run test server on (default: 7357)",
                default: 7357,
              },
              cwd: {
                type: "string" as const,
                description: "Working directory",
              },
              build: {
                type: "boolean" as const,
                description: "Build the app for test environment first (default: true)",
                default: true,
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        const { name, arguments: args } = request.params;

        if (name === "ember_project_info") {
          return await this.getProjectInfo(args as any);
        }

        if (name === "ember_list_addons") {
          return await this.listAddons(args as any);
        }

        if (name === "ember_list_blueprints") {
          return await this.listBlueprints(args as any);
        }

        if (name === "ember_run_command") {
          return await this.runRawCommand(args as any);
        }

        if (name === "ember_stop_server") {
          return await this.stopServer(args as any);
        }

        if (name === "ember_test_server_start") {
          return await this.startTestServer(args as any);
        }

        if (name === "ember_test_server_run") {
          return await this.runTestsOnServer(args as any);
        }

        if (name === "ember_build_test") {
          return await this.buildForTest(args as any);
        }

        if (name.startsWith("ember_")) {
          const commandName = name.replace("ember_", "");
          const command = EMBER_COMMANDS.find((cmd) => cmd.name === commandName);
          
          if (command) {
            return await this.runEmberCommand(command, args as Record<string, any>);
          }
        }

        throw new Error(`Unknown tool: ${name}`);
      }
    );
  }

  private getOptionSchema(option: CommandOption) {
    switch (option.type) {
      case "boolean":
        return {
          type: "boolean" as const,
          description: option.description,
          default: option.default,
        };
      case "number":
        return {
          type: "number" as const,
          description: option.description,
          default: option.default,
        };
      case "choice":
        return {
          type: "string" as const,
          enum: option.choices,
          description: option.description,
          default: option.default,
        };
      default:
        return {
          type: "string" as const,
          description: option.description,
          default: option.default,
        };
    }
  }

  private async runEmberCommand(
    command: EmberCommand,
    args: Record<string, any>
  ) {
    try {
      const cwd = args.cwd || process.cwd();
      const commandArgs: string[] = [];

      // Add positional arguments
      if (command.args) {
        for (const arg of command.args) {
          const value = args[arg.name.replace(/-/g, "_")];
          if (value) {
            commandArgs.push(value);
          }
        }
      }

      // Add options
      for (const option of command.options) {
        const key = option.name.replace(/-/g, "_");
        const value = args[key];
        
        if (value !== undefined && value !== null && value !== option.default) {
          if (option.type === "boolean") {
            if (value) {
              commandArgs.push(`--${option.name}`);
            } else {
              commandArgs.push(`--no-${option.name}`);
            }
          } else {
            commandArgs.push(`--${option.name}`, String(value));
          }
        }
      }

      const fullCommand = `ember ${command.name} ${commandArgs.join(" ")}`.trim();
      
      // For long-running commands like serve, use spawn
      if (command.name === "serve" || (command.name === "build" && args.watch) || 
          (command.name === "test" && args.server)) {
        return await this.runLongRunningCommand(fullCommand, cwd);
      }

      // For regular commands, use exec
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd,
        env: { ...process.env, FORCE_COLOR: "0" },
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      return {
        content: [
          {
            type: "text" as const,
            text: stdout || stderr || `Command executed: ${fullCommand}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing ember ${command.name}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async runRawCommand(args: { command: string; cwd?: string }) {
    try {
      const cwd = args.cwd || process.cwd();
      const fullCommand = `ember ${args.command}`;
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd,
        env: { ...process.env, FORCE_COLOR: "0" },
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: stdout || stderr || `Command executed: ${fullCommand}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing command: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async runLongRunningCommand(command: string, cwd: string) {
    const processId = `ember_${Date.now()}`;
    const [cmd, ...args] = command.split(" ");
    
    const child = spawn(cmd, args, {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
      shell: true,
    });

    this.runningProcesses.set(processId, child);

    // Track test servers specifically
    if (command.includes('test') && command.includes('--server')) {
      // Extract port from command if specified
      const portMatch = command.match(/--test-port\s+(\d+)/);
      const port = portMatch ? parseInt(portMatch[1]) : 7357;
      this.testServerInfo = { port, processId };
    }

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Wait a bit for initial output
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      content: [
        {
          type: "text" as const,
          text: `Started: ${command}\nProcess ID: ${processId}\n\nInitial output:\n${output}${errorOutput}\n\nUse ember_stop_server with process_id "${processId}" to stop this server.`,
        },
      ],
    };
  }

  private async stopServer(args: { process_id: string }) {
    const process = this.runningProcesses.get(args.process_id);
    
    if (!process) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No running process found with ID: ${args.process_id}`,
          },
        ],
        isError: true,
      };
    }

    process.kill("SIGTERM");
    this.runningProcesses.delete(args.process_id);

    return {
      content: [
        {
          type: "text" as const,
          text: `Stopped process: ${args.process_id}`,
        },
      ],
    };
  }

  private async getProjectInfo(args: { cwd?: string }) {
    try {
      const cwd = args.cwd || process.cwd();
      const packageJsonPath = join(cwd, "package.json");
      
      if (!existsSync(packageJsonPath)) {
        throw new Error("No package.json found");
      }

      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
      
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const emberCliVersion = deps["ember-cli"] || "Not found";
      const emberVersion = deps["ember-source"] || "Not found";
      const emberDataVersion = deps["ember-data"] || "Not found";
      const typescriptVersion = deps["typescript"] || "Not found";

      const appPath = join(cwd, "app");
      const testsPath = join(cwd, "tests");
      
      const info: any = {
        name: packageJson.name || "Unknown",
        version: packageJson.version || "Unknown",
        emberCliVersion,
        emberVersion,
        emberDataVersion,
        typescript: typescriptVersion !== "Not found",
        typescriptVersion,
      };

      // Count files in different directories
      if (existsSync(appPath)) {
        info.components = await this.countFiles(join(appPath, "components"), [".js", ".ts", ".gjs", ".gts", ".hbs"]);
        info.routes = await this.countFiles(join(appPath, "routes"), [".js", ".ts"]);
        info.controllers = await this.countFiles(join(appPath, "controllers"), [".js", ".ts"]);
        info.services = await this.countFiles(join(appPath, "services"), [".js", ".ts"]);
        info.helpers = await this.countFiles(join(appPath, "helpers"), [".js", ".ts"]);
        info.models = await this.countFiles(join(appPath, "models"), [".js", ".ts"]);
        info.templates = await this.countFiles(join(appPath, "templates"), [".hbs"]);
      }

      if (existsSync(testsPath)) {
        info.unitTests = await this.countFiles(join(testsPath, "unit"), [".js", ".ts"]);
        info.integrationTests = await this.countFiles(join(testsPath, "integration"), [".js", ".ts", ".gjs", ".gts"]);
        info.acceptanceTests = await this.countFiles(join(testsPath, "acceptance"), [".js", ".ts"]);
      }

      // Check for important features
      info.usingEmbroider = !!deps["@embroider/core"];
      info.usingTypeScript = existsSync(join(cwd, "tsconfig.json"));
      info.usingFastboot = !!deps["ember-cli-fastboot"];
      info.usingMirage = !!deps["ember-cli-mirage"];

      let output = `Ember Project Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Project: ${info.name} v${info.version}
🔥 Ember CLI: ${info.emberCliVersion}
🎯 Ember: ${info.emberVersion}
📊 Ember Data: ${info.emberDataVersion}`;

      if (info.typescript) {
        output += `\n📘 TypeScript: ${info.typescriptVersion}`;
      }

      if (info.usingEmbroider) output += "\n⚡ Embroider: Enabled";
      if (info.usingFastboot) output += "\n🚀 FastBoot: Installed";
      if (info.usingMirage) output += "\n🔧 Mirage: Installed";

      output += `\n\n📁 Application Structure:`;
      if (info.components !== undefined) output += `\n   Components: ${info.components}`;
      if (info.routes !== undefined) output += `\n   Routes: ${info.routes}`;
      if (info.controllers !== undefined) output += `\n   Controllers: ${info.controllers}`;
      if (info.services !== undefined) output += `\n   Services: ${info.services}`;
      if (info.helpers !== undefined) output += `\n   Helpers: ${info.helpers}`;
      if (info.models !== undefined) output += `\n   Models: ${info.models}`;
      if (info.templates !== undefined) output += `\n   Templates: ${info.templates}`;

      if (info.unitTests !== undefined || info.integrationTests !== undefined || info.acceptanceTests !== undefined) {
        output += `\n\n🧪 Tests:`;
        if (info.unitTests !== undefined) output += `\n   Unit: ${info.unitTests}`;
        if (info.integrationTests !== undefined) output += `\n   Integration: ${info.integrationTests}`;
        if (info.acceptanceTests !== undefined) output += `\n   Acceptance: ${info.acceptanceTests}`;
      }

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error getting project info: ${error.message}. Make sure you're in an Ember project directory.`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listAddons(args: { cwd?: string }) {
    try {
      const cwd = args.cwd || process.cwd();
      const packageJsonPath = join(cwd, "package.json");
      
      if (!existsSync(packageJsonPath)) {
        throw new Error("No package.json found");
      }

      const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
      
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};
      
      const allDeps = { ...dependencies, ...devDependencies };
      
      const emberAddons = Object.entries(allDeps)
        .filter(([name]) => 
          name.startsWith("ember-") || 
          name.includes("ember") ||
          name.startsWith("@ember") ||
          name.startsWith("@glimmer")
        )
        .sort(([a], [b]) => a.localeCompare(b));

      const categorized: Record<string, string[]> = {
        "Core Ember": [],
        "Ember CLI": [],
        "Build Tools": [],
        "Testing": [],
        "Styling": [],
        "Data": [],
        "Utilities": [],
        "Other": [],
      };

      for (const [name, version] of emberAddons) {
        const entry = `${name}@${version}`;
        
        if (name.includes("ember-source") || name.includes("@ember") || name.includes("@glimmer")) {
          categorized["Core Ember"].push(entry);
        } else if (name.includes("ember-cli") && !name.includes("addon")) {
          categorized["Ember CLI"].push(entry);
        } else if (name.includes("build") || name.includes("embroider") || name.includes("webpack") || name.includes("rollup")) {
          categorized["Build Tools"].push(entry);
        } else if (name.includes("test") || name.includes("qunit") || name.includes("mocha") || name.includes("mirage")) {
          categorized["Testing"].push(entry);
        } else if (name.includes("style") || name.includes("css") || name.includes("sass") || name.includes("tailwind")) {
          categorized["Styling"].push(entry);
        } else if (name.includes("data") || name.includes("model") || name.includes("apollo") || name.includes("graphql")) {
          categorized["Data"].push(entry);
        } else if (name.includes("util") || name.includes("helper") || name.includes("modifier")) {
          categorized["Utilities"].push(entry);
        } else {
          categorized["Other"].push(entry);
        }
      }

      let output = `Installed Ember Addons (${emberAddons.length} total):\n${"━".repeat(50)}`;
      
      for (const [category, addons] of Object.entries(categorized)) {
        if (addons.length > 0) {
          output += `\n\n📦 ${category}:`;
          for (const addon of addons) {
            output += `\n   • ${addon}`;
          }
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing addons: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async listBlueprints(args: { cwd?: string }) {
    const output = `Available Blueprints for generate/destroy:
${"━".repeat(50)}

📦 Core Components & Templates:
   • component - Generate an Ember component
   • component-class - Generate a component class
   • component-test - Generate a component test
   • template - Generate a template

📦 Routing:
   • route - Generate an Ember route
   • route-test - Generate a route test
   • controller - Generate an Ember controller
   • controller-test - Generate a controller test

📦 Services & Helpers:
   • service - Generate an Ember service
   • service-test - Generate a service test
   • helper - Generate an Ember helper
   • helper-test - Generate a helper test

📦 Data Layer (Ember Data):
   • model - Generate an Ember Data model
   • model-test - Generate a model test
   • adapter - Generate an Ember Data adapter
   • adapter-test - Generate an adapter test
   • serializer - Generate an Ember Data serializer
   • serializer-test - Generate a serializer test
   • transform - Generate an Ember Data transform
   • transform-test - Generate a transform test

📦 Initialization:
   • initializer - Generate an initializer
   • initializer-test - Generate an initializer test
   • instance-initializer - Generate an instance initializer
   • instance-initializer-test - Generate an instance initializer test

📦 Testing:
   • acceptance-test - Generate an acceptance test
   • integration-test - Generate an integration test (alias for component-test)
   • unit-test - Generate a unit test

📦 Utilities:
   • util - Generate a utility
   • util-test - Generate a utility test
   • mixin - Generate a mixin (legacy)
   • mixin-test - Generate a mixin test

📦 Ember CLI Infrastructure:
   • addon - Generate an addon
   • addon-import - Generate an import wrapper
   • app - Generate an app
   • blueprint - Generate a blueprint
   • in-repo-addon - Generate an in-repo addon
   • lib - Generate a lib directory

📦 Server & Mocking:
   • http-mock - Generate a mock API endpoint
   • http-proxy - Generate a proxy configuration
   • server - Generate a server directory

Usage Examples:
   ember generate component my-component
   ember generate route users/profile
   ember generate service authentication
   ember generate model user --typescript
   ember destroy component my-old-component`;

    return {
      content: [
        {
          type: "text" as const,
          text: output,
        },
      ],
    };
  }

  private async countFiles(dirPath: string, extensions: string[]): Promise<number> {
    try {
      if (!existsSync(dirPath)) {
        return 0;
      }
      
      const files = await readdir(dirPath);
      let count = 0;
      
      for (const file of files) {
        const filePath = join(dirPath, file);
        const fileStat = await stat(filePath);
        
        if (fileStat.isFile() && extensions.some(ext => file.endsWith(ext))) {
          count++;
        } else if (fileStat.isDirectory()) {
          count += await this.countFiles(filePath, extensions);
        }
      }
      
      return count;
    } catch {
      return 0;
    }
  }

  private async startTestServer(args: { port?: number; cwd?: string; build?: boolean }) {
    const port = args.port || 7357;
    const cwd = args.cwd || process.cwd();
    const shouldBuild = args.build !== false; // Default to true
    
    // Stop any existing test server
    if (this.testServerInfo) {
      const existingProcess = this.runningProcesses.get(this.testServerInfo.processId);
      if (existingProcess) {
        existingProcess.kill();
        this.runningProcesses.delete(this.testServerInfo.processId);
      }
    }
    
    // Build for test environment first if requested
    if (shouldBuild) {
      try {
        const buildResult = await execAsync("ember build --environment=test", { cwd });
        console.log("Test build completed");
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to build for test environment: ${error}`,
            },
          ],
        };
      }
    }
    
    // Start new test server
    const processId = `test_server_${Date.now()}`;
    const child = spawn("ember", ["test", "--server", "--port", port.toString()], {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
      shell: true,
    });
    
    this.runningProcesses.set(processId, child);
    this.testServerInfo = { port, processId };
    
    let output = "";
    let serverReady = false;
    
    return new Promise<any>((resolve) => {
      const checkReady = (data: Buffer) => {
        output += data.toString();
        if (!serverReady && (output.includes("Serving on") || output.includes("Test server started") || output.includes("testem started"))) {
          serverReady = true;
          resolve({
            content: [
              {
                type: "text" as const,
                text: `Test server started on http://localhost:${port}\nProcess ID: ${processId}\n\nYou can now:\n1. Open http://localhost:${port}/tests in a browser to run tests interactively\n2. Use ember_test_server_run to run tests programmatically`,
              },
            ],
          });
        }
      };
      
      child.stdout.on("data", checkReady);
      child.stderr.on("data", checkReady);
      
      // Timeout fallback
      setTimeout(() => {
        if (!serverReady) {
          resolve({
            content: [
              {
                type: "text" as const,
                text: `Test server starting on port ${port}...\nProcess ID: ${processId}\nIt may take a moment to fully start.\n\nAccess at: http://localhost:${port}/tests`,
              },
            ],
          });
        }
      }, 10000);
    });
  }
  
  private async buildForTest(args: { cwd?: string; force?: boolean }) {
    const cwd = args.cwd || process.cwd();
    const force = args.force || false;
    
    // Check if a build is already in progress
    const existingBuild = this.buildingProjects.get(cwd);
    if (existingBuild) {
      const elapsed = Date.now() - existingBuild.started;
      const elapsedSeconds = Math.floor(elapsed / 1000);
      return {
        content: [
          {
            type: "text" as const,
            text: `⏳ A ${existingBuild.type} build is already in progress (${elapsedSeconds}s elapsed).\n\n` +
                  `Please wait for it to complete before starting another build.`,
          },
        ],
      };
    }
    
    // Check if dist already exists and has test files
    const distPath = path.join(cwd, "dist");
    const testsPath = path.join(distPath, "tests");
    
    if (!force) {
      try {
        await fs.access(testsPath);
        return {
          content: [
            {
              type: "text" as const,
              text: `✅ Test build already exists at ${distPath}\n\n` +
                    `Use --force to rebuild, or run ember_test_server_run to execute tests.`,
            },
          ],
        };
      } catch {
        // Tests don't exist, we need to build
      }
    }
    
    // Start the build
    this.buildingProjects.set(cwd, { started: Date.now(), type: 'test' });
    
    try {
      const startTime = Date.now();
      
      const { stdout, stderr } = await execAsync(`ember build --environment=test`, {
        cwd,
        env: { ...process.env, FORCE_COLOR: "0" },
        timeout: 120000 // 2 minute timeout
      });
      
      const buildTime = ((Date.now() - startTime) / 1000).toFixed(1);
      this.buildingProjects.delete(cwd);
      
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Test build completed in ${buildTime}s!\n\n` +
                  `Output directory: ${distPath}\n` +
                  `You can now run tests with: ember_test_server_run\n\n` +
                  (stdout || stderr || "Build completed successfully."),
          },
        ],
      };
    } catch (error: any) {
      this.buildingProjects.delete(cwd);
      
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Build failed: ${error.message}\n\n${error.stdout || error.stderr || ""}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  private async runTestsOnServer(args: { 
    filter?: string; 
    module?: string; 
    cwd?: string;
    reporter?: string;
  }) {
    const cwd = args.cwd || process.cwd();
    const reporter = args.reporter || "tap";
    
    // Check if a build is already in progress for this project
    const existingBuild = this.buildingProjects.get(cwd);
    if (existingBuild) {
      const elapsed = Date.now() - existingBuild.started;
      const elapsedSeconds = Math.floor(elapsed / 1000);
      return {
        content: [
          {
            type: "text" as const,
            text: `⏳ A ${existingBuild.type} build is already in progress for this project (${elapsedSeconds}s elapsed).\n\n` +
                  `Please wait for it to complete or run this command again in a few moments.\n` +
                  `The build typically takes 10-30 seconds depending on project size.`,
          },
        ],
      };
    }
    
    // Always look for the dist directory with test build
    const distPath = path.join(cwd, "dist");
    
    let needsBuild = false;
    try {
      await fs.access(distPath);
      // Check if the dist has test files
      const testsPath = path.join(distPath, "tests");
      try {
        await fs.access(testsPath);
      } catch {
        needsBuild = true; // dist exists but no test files
      }
    } catch {
      needsBuild = true; // no dist at all
    }
    
    if (needsBuild) {
      // Mark that we're building
      this.buildingProjects.set(cwd, { started: Date.now(), type: 'test' });
      
      try {
        // Inform user that build is starting
        console.log("🔨 Building test environment... This may take 10-30 seconds.");
        
        const buildOutput = await execAsync(`ember build --environment=test`, {
          cwd,
          env: { ...process.env, FORCE_COLOR: "0" },
          timeout: 120000 // 2 minute timeout for build
        });
        
        // Build completed successfully
        this.buildingProjects.delete(cwd);
        console.log("✅ Test build completed successfully!");
        
      } catch (buildError: any) {
        // Build failed, clean up tracking
        this.buildingProjects.delete(cwd);
        
        return {
          content: [
            {
              type: "text" as const,
              text: `❌ Failed to build test environment: ${buildError.message}\n\nPlease ensure you're in an Ember project directory with all dependencies installed.`,
            },
          ],
        };
      }
    }
    
    // Now run tests using the pre-built dist directory
    const testArgs = ["test", "--path", distPath, "--reporter", reporter];
    
    if (args.filter) {
      testArgs.push("--filter", args.filter);
    }
    if (args.module) {
      testArgs.push("--module", args.module);
    }
    
    try {
      // Run tests using the pre-built dist directory
      const { stdout, stderr } = await execAsync(`ember ${testArgs.join(" ")}`, { 
        cwd,
        env: { ...process.env, CI: "true" }, // Set CI to avoid browser launch
        timeout: 60000 // 1 minute timeout for test run
      });
      
      return {
        content: [
          {
            type: "text" as const,
            text: stdout || stderr || "Tests completed. Check console output for details.",
          },
        ],
      };
    } catch (error: any) {
      // Even on test failures, we want to show the output
      const output = error.stdout || error.stderr || error.message;
      return {
        content: [
          {
            type: "text" as const,
            text: output,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new EmberCliMcpServer();
server.run().catch(console.error);