/**
 * TrashDrop Collector - Environment Setup Script
 * 
 * This script helps set up the environment variables for development.
 * It creates a .env file from .env.example if one doesn't exist.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const existsAsync = promisify(fs.exists);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Main function
 */
async function main() {
  console.log('\n🌱 TrashDrop Collector Environment Setup\n');
  
  const envPath = path.join(__dirname, '.env');
  const exampleEnvPath = path.join(__dirname, '.env.example');
  
  // Check if .env file already exists
  const envExists = await existsAsync(envPath);
  
  if (envExists) {
    console.log('✅ .env file already exists.');
    
    const overwrite = await question('Do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\n🛑 Setup aborted. Your existing .env file was not modified.');
      rl.close();
      return;
    }
  }
  
  try {
    // Read .env.example content
    const exampleContent = await readFileAsync(exampleEnvPath, 'utf8');
    const envVars = parseEnvExample(exampleContent);
    
    let userEnvContent = '';
    
    console.log('\n📝 Please provide values for the following environment variables:');
    console.log('   (Press Enter to use default values where available)\n');
    
    // Process each environment variable
    for (const [key, { value, description }] of Object.entries(envVars)) {
      let userValue;
      
      if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
        // For sensitive variables, don't show default in prompt
        userValue = await question(`${key} (sensitive): `);
      } else {
        // For non-sensitive variables, show default
        userValue = await question(`${key} [${value}]: `);
      }
      
      // Use user input or default value
      const finalValue = userValue.trim() || value;
      
      // Add to .env content
      userEnvContent += `${key}=${finalValue}\n`;
    }
    
    // Write to .env file
    await writeFileAsync(envPath, userEnvContent);
    
    console.log('\n✅ Environment setup complete!');
    console.log(`📄 .env file created at: ${envPath}`);
    
  } catch (error) {
    console.error('❌ Error setting up environment:', error.message);
  } finally {
    rl.close();
  }
}

/**
 * Parse .env.example file to extract variables and default values
 * @param {string} content - Content of .env.example file
 * @returns {Object} - Object with keys as variable names and values as { value, description }
 */
function parseEnvExample(content) {
  const lines = content.split('\n');
  const envVars = {};
  let currentComment = '';
  
  for (const line of lines) {
    // Collect comments as descriptions
    if (line.startsWith('#')) {
      currentComment += line.substring(1).trim() + ' ';
      continue;
    }
    
    // Parse variable assignment
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      envVars[key] = { 
        value, 
        description: currentComment.trim()
      };
      
      // Reset comment
      currentComment = '';
    }
  }
  
  return envVars;
}

// Run the script
main().catch(console.error);
