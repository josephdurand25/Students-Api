#!/usr/bin/env node
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || '';
const SQL_PATH = path.resolve(__dirname, '../src/Database/database_v2.sql');

if (!DB_NAME) {
  console.error('✖ DB_NAME not set in environment.');
  process.exit(1);
}

if (!fs.existsSync(SQL_PATH)) {
  console.error(`✖ SQL file not found at ${SQL_PATH}`);
  process.exit(1);
}

const mysqlArgs = ['-h', DB_HOST, '-u', DB_USER, '-p' + DB_PASSWORD]; // connect without selecting a DB so we can create it

console.log('🔧 Launching mysql client with arguments:', mysqlArgs.join(' '));

const mysql = spawn('mysql', mysqlArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

let sql = fs.readFileSync(SQL_PATH, { encoding: 'utf8' });

// Replace the database name in the SQL with DB_NAME from .env where possible
sql = sql.replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[`']?\w+[`']?/i, `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
sql = sql.replace(/USE\s+[`']?\w+[`']?/i, `USE \`${DB_NAME}\``);

// Temporarily disable foreign key checks at start, re-enable at end to allow out-of-order creation
sql = `SET FOREIGN_KEY_CHECKS=0;\n${sql}\nSET FOREIGN_KEY_CHECKS=1;`;

mysql.stdin.write(sql);
mysql.stdin.end();

mysql.on('close', code => {
  if (code === 0) {
    console.log('✅ Database initialization completed successfully.');
  } else {
    console.error('✖ mysql exited with code', code);
  }
});

mysql.on('error', err => {
  console.error('✖ Failed to start mysql client. Is it installed and on PATH?');
  console.error(err);
  process.exit(1);
});