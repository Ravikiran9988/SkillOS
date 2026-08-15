const path = require('path');
const fs = require('fs');

// Try loading .env from workspace root or current directory
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
    break;
  }
}
require('dotenv').config(); // fallback default

const neo4j = require('neo4j-driver');

let driver = null;

/**
 * Safely converts a Neo4j integer (or regular number/null) to a JS number.
 */
function toNum(val, defaultVal = 0) {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number') return val;
  if (typeof val.toNumber === 'function') return val.toNumber();
  const parsed = Number(val);
  return isNaN(parsed) ? defaultVal : parsed;
}

/**
 * Initialize the Neo4j driver using CognoDB connection details from env vars.
 * Returns the driver instance (singleton).
 */
function getDriver() {
  if (driver) return driver;

  const uri = process.env.COGNODB_URI;
  const username = process.env.COGNODB_USERNAME || 'cognodb';
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !password || uri.includes('db-xxxxxxxx')) {
    throw new Error(
      'Missing CognoDB credentials. Please set COGNODB_URI and COGNODB_PASSWORD in your .env file.'
    );
  }

  driver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password),
    {
      maxConnectionPoolSize: 50,
      connectionTimeout: 10000,
      maxTransactionRetryTime: 15000,
    }
  );

  return driver;
}

/**
 * Verify the database connection is healthy.
 * Throws if the database cannot be reached.
 */
async function verifyConnectivity() {
  const d = getDriver();
  await d.verifyConnectivity();
}

/**
 * Gracefully close the driver on shutdown.
 */
async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/**
 * Execute a read query with a Neo4j session.
 * @param {string} query - Parameterized Cypher query
 * @param {object} params - Query parameters
 * @returns {neo4j.QueryResult}
 */
async function read(query, params = {}) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.READ });
  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
}

/**
 * Execute a write query with a Neo4j session.
 * @param {string} query - Parameterized Cypher query
 * @param {object} params - Query parameters
 * @returns {neo4j.QueryResult}
 */
async function write(query, params = {}) {
  const session = getDriver().session({ defaultAccessMode: neo4j.session.WRITE });
  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
}

module.exports = { getDriver, verifyConnectivity, closeDriver, read, write, toNum };
