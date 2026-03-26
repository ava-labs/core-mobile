#!/usr/bin/env node
/**
 * Script to load environment variables from AWS Secrets Manager
 * Fetches the secret "core/dev/mobile/.env.internal.e2e" and exports all variables
 * 
 * This script is designed to run in AWS Device Farm's pre_test phase.
 * On success, stdout is only the generated env file path (logs go to stderr).
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const fs = require('fs');

/**
 * Only allow standard shell variable names so the generated `export` line cannot
 * inject additional commands.
 */
function isValidShellVarName(name) {
  return typeof name === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);
}

/**
 * Produce a bash-safe single-quoted literal for `export NAME=...`.
 * Unlike double-quoted strings, single-quoted strings do not expand `$`, `` ` ``,
 * or `$(...)`. Embedded single quotes use the `'\''` idiom.
 */
function bashSingleQuotedLiteral(value) {
  const s = String(value);
  const escaped = s.replace(/'/g, "'\\''");
  return `'${escaped}'`;
}

const secret_name = "core/dev/mobile/.env.internal.e2e";
// Align default with Device Farm tooling (trigger-devicefarm-api.js uses us-west-2).
const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

const client = new SecretsManagerClient({
  region: region,
});

async function loadSecrets() {
  try {
    console.error(
      `Fetching secret "${secret_name}" from AWS Secrets Manager (region: ${region})...`
    );
    
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT",
      })
    );

    const secret = response.SecretString;
    
    if (!secret) {
      console.error("❌ Secret value is empty");
      process.exit(1);
    }

    console.error('✅ Successfully retrieved secret from AWS Secrets Manager');
    
    // Parse the secret (it should be in .env format: KEY=VALUE)
    const lines = secret.split('\n');
    const envVars = [];
    
    for (const line of lines) {
      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Parse KEY=VALUE format
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match && match[1] && match[2] !== undefined) {
        const key = match[1].trim();
        // Remove quotes if present
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        
        envVars.push({ key, value });
      }
    }
    
    // Write to a file that can be sourced in bash (single-quoted values; no eval-style expansion)
    const envFile = '/tmp/devicefarm-env-vars.sh';
    const envContent = envVars
      .filter(({ key }) => {
        if (!isValidShellVarName(key)) {
          console.error(
            `⚠️ Skipping env key (not a safe shell identifier): ${key}`
          );
          return false;
        }
        return true;
      })
      .map(
        ({ key, value }) =>
          `export ${key}=${bashSingleQuotedLiteral(value)}`
      )
      .join('\n');
    
    fs.writeFileSync(envFile, envContent);
    
    // Output to stderr so it doesn't interfere with sourcing
    console.error(`✅ Environment variables written to ${envFile}`);
    console.error(`   Found ${envVars.length} environment variables`);
    
    // Output the file path to stdout so it can be captured
    console.log(envFile);
    
  } catch (error) {
    console.error("❌ Error fetching secret from AWS Secrets Manager:");
    console.error(`   Error: ${error.message}`);
    if (error.name === 'ResourceNotFoundException') {
      console.error(`   Secret "${secret_name}" not found in region ${region}`);
    } else if (error.name === 'AccessDeniedException') {
      console.error(`   Access denied. Check IAM permissions for Secrets Manager.`);
    }
    console.error(`\n   Full error:`, error);
    process.exit(1);
  }
}

loadSecrets();
