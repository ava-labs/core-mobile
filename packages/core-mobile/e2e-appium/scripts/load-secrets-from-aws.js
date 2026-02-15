#!/usr/bin/env node
/**
 * Script to load environment variables from AWS Secrets Manager
 * Fetches the secret "core/dev/mobile/.env.internal.e2e" and exports all variables
 * 
 * This script is designed to run in AWS Device Farm's pre_test phase
 */

const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const fs = require('fs');

const secret_name = "core/dev/mobile/.env.internal.e2e";
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";

const client = new SecretsManagerClient({
  region: region,
});

async function loadSecrets() {
  try {
    console.log(`Fetching secret "${secret_name}" from AWS Secrets Manager (region: ${region})...`);
    
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

    console.log("✅ Successfully retrieved secret from AWS Secrets Manager");
    
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
    
    // Write to a file that can be sourced in bash
    const envFile = '/tmp/devicefarm-env-vars.sh';
    const envContent = envVars.map(({ key, value }) => {
      // Escape special characters for bash: escape $, ", \, and newlines
      const escapedValue = value
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/\$/g, '\\$')   // Escape dollar signs
        .replace(/"/g, '\\"')    // Escape double quotes
        .replace(/'/g, "\\'")    // Escape single quotes
        .replace(/\n/g, '\\n')   // Escape newlines
        .replace(/\r/g, '\\r');  // Escape carriage returns
      return `export ${key}="${escapedValue}"`;
    }).join('\n');
    
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
