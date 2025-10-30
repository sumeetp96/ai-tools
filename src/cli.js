#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import fs from "fs/promises";
import ora from "ora";
import { stdin, stdout } from "process";
import configManager from "./core/config.js";
import ProviderFactory from "./core/provider-factory.js";
import ToolRegistry from "./tools/index.js";

const program = new Command();

/**
 * Read from stdin
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf-8");

    stdin.on("data", (chunk) => {
      data += chunk;
    });

    stdin.on("end", () => {
      resolve(data);
    });

    stdin.on("error", reject);
  });
}

/**
 * Execute a tool
 */
async function executeTool(toolName, input, options) {
  const spinner = ora("Loading configuration...").start();

  try {
    // Merge config with CLI options
    const config = await configManager.mergeOptions({
      provider: options.provider,
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    spinner.text = `Initializing ${config.provider} provider...`;

    // Create provider
    const provider = ProviderFactory.create(config.provider, config);

    // Check if provider is available
    if (!(await provider.isAvailable())) {
      spinner.fail(chalk.red(`${config.provider} is not available`));
      console.log(
        chalk.yellow("\nMake sure Ollama is running or API keys are set.")
      );
      process.exit(1);
    }

    spinner.text = "Creating tool...";

    // Create tool
    const tool = ToolRegistry.create(toolName, provider);

    spinner.text = `Processing with ${config.model}...`;

    // Execute tool
    if (options.stream) {
      spinner.stop();
      console.log(chalk.dim(`Using ${config.provider} (${config.model})\n`));

      const stream = await tool.executeStream(input, options);
      let result = "";

      for await (const chunk of stream) {
        const text = chunk.message.content;
        stdout.write(text);
        result += text;
      }

      // Write to output file if specified
      if (options.output) {
        await fs.writeFile(options.output, result, "utf-8");
        console.log(chalk.green(`\n\n✓ Saved to ${options.output}`));
      }
    } else {
      const result = await tool.execute(input, options);
      spinner.succeed(chalk.green("Done!"));

      // Output result
      if (options.output) {
        await fs.writeFile(options.output, result, "utf-8");
        console.log(chalk.green(`\n✓ Saved to ${options.output}`));
      } else {
        console.log("\n" + result);
      }
    }
  } catch (error) {
    spinner.fail(chalk.red("Error!"));
    console.error(chalk.red(`\n${error.message}`));
    process.exit(1);
  }
}

// Main program
program
  .name("ai-tools")
  .description("CLI and web tools powered by AI models")
  .version("0.1.0");

// Compress command
program
  .command("compress [input]")
  .description("Compress verbose documentation")
  .option("-o, --output <file>", "Output file")
  .option("-p, --provider <name>", "AI provider (ollama, openai, anthropic)")
  .option("-m, --model <name>", "Model name")
  .option("-t, --temperature <number>", "Temperature (0-1)", parseFloat)
  .option("--max-tokens <number>", "Max tokens", parseInt)
  .option("-s, --stream", "Stream output")
  .option("--target-length <percent>", "Target length as percentage", parseInt)
  .action(async (input, options) => {
    let content;

    if (input) {
      content = await fs.readFile(input, "utf-8");
    } else {
      content = await readStdin();
    }

    if (!content.trim()) {
      console.error(chalk.red("Error: No input provided"));
      process.exit(1);
    }

    await executeTool("compress", content, options);
  });

// Config command
program
  .command("config")
  .description("Manage configuration")
  .argument("[action]", "Action: show, init, set, get")
  .argument("[key]", "Config key")
  .argument("[value]", "Config value")
  .action(async (action = "show", key, value) => {
    try {
      switch (action) {
        case "show": {
          const config = await configManager.get();
          console.log(JSON.stringify(config, null, 2));
          break;
        }

        case "init": {
          const location = key || "home";
          const path = await configManager.createDefault(location);
          console.log(chalk.green(`✓ Created config at: ${path}`));
          break;
        }

        case "set": {
          if (!key || !value) {
            console.error(chalk.red("Error: Key and value required"));
            process.exit(1);
          }
          await configManager.set(key, value);
          console.log(chalk.green(`✓ Set ${key} = ${value}`));
          break;
        }

        case "get": {
          if (!key) {
            console.error(chalk.red("Error: Key required"));
            process.exit(1);
          }
          const val = await configManager.get(key);
          console.log(val);
          break;
        }

        default:
          console.error(chalk.red(`Unknown action: ${action}`));
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// List command
program
  .command("list")
  .description("List available tools and providers")
  .action(() => {
    console.log(chalk.bold("\nAvailable Tools:"));
    const tools = ToolRegistry.getToolDescriptions();
    for (const [name, desc] of Object.entries(tools)) {
      console.log(chalk.cyan(`  ${name}`) + ` - ${desc}`);
    }

    console.log(chalk.bold("\nAvailable Providers:"));
    const providers = ProviderFactory.getAvailableProviders();
    providers.forEach((p) => {
      console.log(chalk.cyan(`  ${p}`));
    });
    console.log();
  });

program.parse();
