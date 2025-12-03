#!/usr/bin/env node

/**
 * GitHub Issue Creator Script
 * 
 * This script helps create GitHub issues programmatically for the Celo Wallet Starter Kit.
 * It can create issues from templates or custom content.
 * 
 * Usage:
 *   node scripts/create-issue.js --type bug --title "Issue title" --description "Issue description"
 *   node scripts/create-issue.js --template feature --data '{"title": "Feature title", "description": "Feature description"}'
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const config = {
  owner: process.env.GITHUB_OWNER || 'your-github-username', // Change this to your GitHub username/org
  repo: 'ship-celo-wallet', // Change this to your repository name
  token: process.env.GITHUB_TOKEN, // Personal Access Token with repo scope
};

// Available issue types
const ISSUE_TYPES = {
  bug: {
    template: 'bug_report.md',
    labels: ['bug', 'needs-triage']
  },
  feature: {
    template: 'feature_request.md',
    labels: ['enhancement', 'needs-triage']
  },
  enhancement: {
    template: 'enhancement.md',
    labels: ['enhancement', 'needs-triage']
  },
  documentation: {
    template: 'documentation.md',
    labels: ['documentation', 'needs-triage']
  }
};

/**
 * Load issue template from file
 */
function loadTemplate(templateName) {
  const templatePath = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE', templateName);
  
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    console.error(`❌ Could not load template: ${templatePath}`);
    process.exit(1);
  }
}

/**
 * Extract form fields from markdown template
 */
function extractTemplateFields(template) {
  const fields = [];
  const fieldRegex = /- \*\*([^*]+):\*\*\s*\[(.*?)\]/g;
  let match;
  
  while ((match = fieldRegex.exec(template)) !== null) {
    fields.push({
      name: match[1].toLowerCase().replace(/\s+/g, '_'),
      description: match[1],
      default: match[2] || ''
    });
  }
  
  return fields;
}

/**
 * Replace template placeholders with actual data
 */
function fillTemplate(template, data) {
  let filled = template;
  
  // Replace section headers with data
  if (data.description) {
    filled = filled.replace(/## Feature Description\s*\n.*?\n\n/, `## Feature Description\n${data.description}\n\n`);
  }
  
  if (data.problem) {
    filled = filled.replace(/## Problem Statement\s*\n.*?\n\n/, `## Problem Statement\n${data.problem}\n\n`);
  }
  
  if (data.solution) {
    filled = filled.replace(/## Proposed Solution\s*\n.*?\n\n/, `## Proposed Solution\n${data.solution}\n\n`);
  }
  
  // Replace specific fields
  Object.keys(data).forEach(key => {
    const fieldRegex = new RegExp(`- \\*\\*${key}:\\*\\*.*`, 'g');
    filled = filled.replace(fieldRegex, `- **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${data[key]}`);
  });
  
  return filled;
}

/**
 * Create issue via GitHub API
 */
function createIssue(title, body, labels = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title,
      body,
      labels
    });
    
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/repos/${config.owner}/${config.repo}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${config.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Celo-Wallet-Issue-Creator/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          const issue = JSON.parse(responseData);
          console.log(`✅ Issue created successfully: ${issue.html_url}`);
          resolve(issue);
        } else {
          console.error(`❌ Failed to create issue: ${res.statusCode}`);
          console.error(responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Interactive mode for creating issues
 */
function interactiveMode() {
  console.log('\n🚀 GitHub Issue Creator - Interactive Mode\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const questions = [
    { key: 'type', question: 'Issue type (bug/feature/enhancement/documentation): ' },
    { key: 'title', question: 'Issue title: ' },
    { key: 'description', question: 'Issue description: ' },
    { key: 'priority', question: 'Priority (low/medium/high/critical): ' },
    { key: 'assignees', question: 'Assignees (comma-separated usernames, optional): ' }
  ];
  
  const answers = {};
  let currentQuestion = 0;
  
  function askQuestion() {
    if (currentQuestion >= questions.length) {
      rl.close();
      processAnswers(answers);
      return;
    }
    
    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
      answers[q.key] = answer.trim();
      currentQuestion++;
      askQuestion();
    });
  }
  
  function processAnswers(answers) {
    const issueType = answers.type.toLowerCase();
    
    if (!ISSUE_TYPES[issueType]) {
      console.error('❌ Invalid issue type. Must be one of:', Object.keys(ISSUE_TYPES).join(', '));
      process.exit(1);
    }
    
    // Create labels array
    const labels = [...ISSUE_TYPES[issueType].labels];
    if (answers.priority) {
      labels.push(answers.priority.toLowerCase());
    }
    
    // Create issue body
    let body = answers.description;
    if (answers.assignees) {
      const assignees = answers.assignees.split(',').map(a => a.trim()).filter(a => a);
      if (assignees.length > 0) {
        body += `\n\n**Assignees:** ${assignees.join(', ')}`;
      }
    }
    
    // Create the issue
    if (config.token) {
      createIssue(answers.title, body, labels)
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('❌ Failed to create issue:', error.message);
          process.exit(1);
        });
    } else {
      console.log('\n📝 Issue would be created with:');
      console.log(`Title: ${answers.title}`);
      console.log(`Labels: ${labels.join(', ')}`);
      console.log('Body:');
      console.log(body);
      console.log('\nℹ️  Set GITHUB_TOKEN environment variable to actually create the issue.');
      process.exit(0);
    }
  }
  
  askQuestion();
}

/**
 * Command line mode
 */
function commandLineMode(args) {
  const type = args.type || 'bug';
  const title = args.title;
  const description = args.description || args.desc || '';
  
  if (!ISSUE_TYPES[type]) {
    console.error('❌ Invalid issue type. Must be one of:', Object.keys(ISSUE_TYPES).join(', '));
    process.exit(1);
  }
  
  if (!title) {
    console.error('❌ Title is required. Use --title "Your issue title"');
    process.exit(1);
  }
  
  // Create issue data
  const data = {
    description: description,
    priority: args.priority || 'medium',
    assignee: args.assignee || ''
  };
  
  const labels = [...ISSUE_TYPES[type].labels];
  if (args.priority) {
    labels.push(args.priority.toLowerCase());
  }
  
  // Create the issue
  if (config.token) {
    createIssue(title, description, labels)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('❌ Failed to create issue:', error.message);
        process.exit(1);
      });
  } else {
    console.log('\n📝 Issue would be created with:');
    console.log(`Title: ${title}`);
    console.log(`Labels: ${labels.join(', ')}`);
    console.log('Body:');
    console.log(description);
    console.log('\nℹ️  Set GITHUB_TOKEN environment variable to actually create the issue.');
    process.exit(0);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 GitHub Issue Creator for Celo Wallet Starter Kit

Usage:
  node scripts/create-issue.js [options]
  node scripts/create-issue.js --interactive

Options:
  --type, -t           Issue type: bug, feature, enhancement, documentation
  --title, -T          Issue title (required in CLI mode)
  --description, -D    Issue description
  --priority, -P       Priority: low, medium, high, critical
  --assignee, -A       Assignee username
  --interactive, -i    Run in interactive mode
  --help, -h           Show this help message

Environment Variables:
  GITHUB_TOKEN         Personal Access Token with repo scope
  GITHUB_OWNER         GitHub owner (username/org), default: your-github-username
  GITHUB_REPO          Repository name, default: ship-celo-wallet

Examples:
  # Interactive mode
  node scripts/create-issue.js --interactive
  
  # Create a bug report
  node scripts/create-issue.js --type bug --title "Wallet connection fails" --description "Cannot connect to MetaMask"
  
  # Create a feature request
  node scripts/create-issue.js --type feature --title "Add transaction history" --priority high
  
  # With custom token and repo
  GITHUB_TOKEN=ghp_xxx GITHUB_OWNER=my-org GITHUB_REPO=my-dapp node scripts/create-issue.js --type bug --title "Test issue"
`);
    process.exit(0);
  }
  
  // Check for interactive mode
  if (args.includes('--interactive') || args.includes('-i')) {
    interactiveMode();
    return;
  }
  
  // Parse command line arguments
  const parsedArgs = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    parsedArgs[key] = args[i + 1];
  }
  
  commandLineMode(parsedArgs);
}

// Run main function
if (require.main === module) {
  main();
}