#!/usr/bin/env node
import { Command, Option } from "commander";
import { runLoginFlow } from "./auth.js";
import { SERVER_VERSION, TOKEN_PATH } from "./constants.js";
import { startServer } from "./index.js";
import { type ClientName, configReport, runSetup } from "./setup.js";

const CLIENT_CHOICES = ["codex", "claude", "copilot", "all"] as const;

async function login(): Promise<void> {
  console.error("Starting Google sign-in... a browser window will open.\n");
  const result = await runLoginFlow({
    openBrowser: true,
    onUrl: (url) => {
      console.error(`If the browser didn't open, visit:\n${url}\n`);
    },
  });
  console.error(`\nSigned in${result.email ? ` as ${result.email}` : ""}.`);
  console.error(`Token saved to ${TOKEN_PATH}`);
  console.error(`Granted scopes: ${result.scopes.join(", ")}`);
}

function buildProgram(): Command {
  const program = new Command();

  program
    .name("kozocom-mcp")
    .description("Kozocom Google Drive & Sheets MCP server")
    .version(SERVER_VERSION);

  // Default action (`kozocom-mcp` with no subcommand) starts the server.
  program
    .command("start", { isDefault: true })
    .alias("server")
    .description("Start the MCP server over stdio")
    .action(async () => {
      await startServer();
    });

  program
    .command("login")
    .description("Sign in to Google and cache the OAuth token")
    .action(async () => {
      await login();
    });

  program
    .command("setup")
    .description("Check setup, optionally sign in, and print MCP config")
    .addOption(
      new Option("-c, --client <client>", "MCP client to configure").choices(CLIENT_CHOICES),
    )
    .option("--login", "Run Google login during setup")
    .option("--no-login", "Skip Google login during setup")
    .option("-y, --yes", "Accept defaults without prompting")
    .action(async (opts: { client?: ClientName; login?: boolean; yes?: boolean }, command: Command) => {
      // Commander defaults `login` to true because of `--no-login`; only honor
      // it when the user actually passed a flag, else leave it for the prompt.
      const loginSet = command.getOptionValueSource("login") === "cli";
      await runSetup({ client: opts.client, login: loginSet ? opts.login : undefined, yes: opts.yes });
    });

  program
    .command("config")
    .description("Print MCP config for a client with dangerous tools disabled")
    .addOption(
      new Option("-c, --client <client>", "MCP client to configure")
        .choices(CLIENT_CHOICES)
        .default("all"),
    )
    .option("--include-dangerous", "Keep destructive tools enabled (not recommended)", false)
    .action((opts: { client: ClientName; includeDangerous: boolean }) => {
      console.log(configReport({ client: opts.client, safeMode: !opts.includeDangerous }));
    });

  return program;
}

buildProgram()
  .parseAsync(process.argv)
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
