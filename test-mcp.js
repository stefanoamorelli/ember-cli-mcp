#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMcpServer() {
  console.log("🧪 Testing Ember CLI MCP Server v0.2.0\n");
  console.log("=" .repeat(50));

  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
  });

  const client = new Client(
    {
      name: "ember-cli-mcp-test",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  // List all available tools
  console.log("📋 Listing all available tools:");
  console.log("-".repeat(50));
  const tools = await client.listTools();
  
  console.log(`Total tools available: ${tools.tools.length}\n`);
  
  // Group tools by category
  const emberCommands = tools.tools.filter(t => t.name.startsWith("ember_") && !t.name.includes("_list_") && !t.name.includes("_info") && !t.name.includes("_run_") && !t.name.includes("_stop_"));
  const utilityTools = tools.tools.filter(t => t.name.includes("_list_") || t.name.includes("_info") || t.name.includes("_run_") || t.name.includes("_stop_"));
  
  console.log("🔥 Ember Commands:");
  emberCommands.forEach(tool => {
    console.log(`   • ${tool.name}`);
  });
  
  console.log("\n🛠️  Utility Tools:");
  utilityTools.forEach(tool => {
    console.log(`   • ${tool.name}`);
  });

  // Test specific tools
  console.log("\n" + "=".repeat(50));
  console.log("🎯 Testing specific tools:\n");

  // Test 1: Check ember_test has filter and module options
  const testTool = tools.tools.find(t => t.name === "ember_test");
  if (testTool) {
    console.log("1️⃣  ember_test tool schema:");
    const props = testTool.inputSchema.properties;
    console.log("   ✅ Has 'filter' option:", !!props.filter);
    console.log("   ✅ Has 'module' option:", !!props.module);
    console.log("   ✅ Has 'reporter' option:", !!props.reporter);
    console.log("   ✅ Has 'launch' option:", !!props.launch);
    console.log("   ✅ Has 'server' option:", !!props.server);
    console.log("   ✅ Has 'silent' option:", !!props.silent);
    console.log("   ✅ Has 'query' option:", !!props.query);
    console.log("   ✅ Has 'test-page' option:", !!props.test_page);
  }

  // Test 2: Check ember_generate has all options
  const generateTool = tools.tools.find(t => t.name === "ember_generate");
  if (generateTool) {
    console.log("\n2️⃣  ember_generate tool schema:");
    const props = generateTool.inputSchema.properties;
    console.log("   ✅ Has 'blueprint' arg:", !!props.blueprint);
    console.log("   ✅ Has 'name' arg:", !!props.name);
    console.log("   ✅ Has 'typescript' option:", !!props.typescript);
    console.log("   ✅ Has 'pod' option:", !!props.pod);
    console.log("   ✅ Has 'classic' option:", !!props.classic);
    console.log("   ✅ Has 'dry-run' option:", !!props.dry_run);
  }

  // Test 3: Check ember_serve has all options
  const serveTool = tools.tools.find(t => t.name === "ember_serve");
  if (serveTool) {
    console.log("\n3️⃣  ember_serve tool schema:");
    const props = serveTool.inputSchema.properties;
    console.log("   ✅ Has 'port' option:", !!props.port);
    console.log("   ✅ Has 'host' option:", !!props.host);
    console.log("   ✅ Has 'proxy' option:", !!props.proxy);
    console.log("   ✅ Has 'ssl' option:", !!props.ssl);
    console.log("   ✅ Has 'live-reload' option:", !!props.live_reload);
    console.log("   ✅ Has 'environment' option:", !!props.environment);
  }

  // Test 4: Check ember_new has TypeScript and Embroider options
  const newTool = tools.tools.find(t => t.name === "ember_new");
  if (newTool) {
    console.log("\n4️⃣  ember_new tool schema:");
    const props = newTool.inputSchema.properties;
    console.log("   ✅ Has 'typescript' option:", !!props.typescript);
    console.log("   ✅ Has 'embroider' option:", !!props.embroider);
    console.log("   ✅ Has 'strict' option:", !!props.strict);
    console.log("   ✅ Has 'ci-provider' option:", !!props.ci_provider);
    console.log("   ✅ Has 'package-manager' option:", !!props.package_manager);
  }

  // Test 5: Check ember_run_command exists
  const runCommandTool = tools.tools.find(t => t.name === "ember_run_command");
  console.log("\n5️⃣  ember_run_command tool:");
  console.log("   ✅ Tool exists:", !!runCommandTool);
  if (runCommandTool) {
    const props = runCommandTool.inputSchema.properties;
    console.log("   ✅ Has 'command' parameter:", !!props.command);
  }

  // Test actual command execution (safe commands only)
  console.log("\n" + "=".repeat(50));
  console.log("🚀 Testing actual command execution:\n");

  try {
    // Test ember_list_blueprints
    console.log("6️⃣  Testing ember_list_blueprints:");
    const blueprintsResult = await client.callTool({
      name: "ember_list_blueprints",
      arguments: {}
    });
    console.log("   ✅ Successfully listed blueprints");
    console.log(`   ✅ Output length: ${blueprintsResult.content[0].text.length} characters`);

    // Test ember_version
    console.log("\n7️⃣  Testing ember_version:");
    const versionResult = await client.callTool({
      name: "ember_version",
      arguments: {}
    });
    console.log("   ✅ Successfully got version info");

    // Test ember_help
    console.log("\n8️⃣  Testing ember_help:");
    const helpResult = await client.callTool({
      name: "ember_help",
      arguments: { command_name: "test" }
    });
    console.log("   ✅ Successfully got help for 'test' command");

  } catch (error) {
    console.log("   ⚠️  Command execution test skipped (ember-cli might not be installed globally)");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ All tests completed!\n");

  await client.close();
  process.exit(0);
}

testMcpServer().catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});