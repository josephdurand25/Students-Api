#!/usr/bin/env node
const { spawn } = require('node.child_process');
const fs = require('node.fs');
const path = require('node.path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || '';

if (!DB_NAME) {
  console.error('✖ DB_NAME not set in environment.');
  process.exit(1);
}
const seederFiles = [
  {
    label: 'Seeder complet',
    file: path.resolve(__dirname, '../src/Database/seeder.sql')
  },
  {
    label: 'Seeder minimal',
    file: path.resolve(__dirname, '../src/Database/minimal-seeder.sql')
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🌱 Quel seeder voulez-vous exécuter ?\n');
seederFiles.forEach((s, index) => {
  console.log(` ${index + 1}) ${s.label}`);
});

rl.question('\n👉 Votre choix (1 ou 2) : ', answer => {
  const choice = Number.parseInt(answer, 10);

  if (Number.isNaN(choice) || choice < 1 || choice > seederFiles.length) {
    console.error('✖ Choix invalide.');
    rl.close();
    process.exit(1);
  }
    const SQL_PATH = seederFiles[choice - 1].file;
  rl.close();

  runSeeder(SQL_PATH);
});

function runSeeder(SQL_PATH){
  if (!fs.existsSync(SQL_PATH)) {
    console.error(`✖ SQL seed file not found at ${SQL_PATH}`);
    console.log('💡 Creating seed file...');
    
    // Créer le fichier seed.sql s'il n'existe pas
    const seedSQL = `-- Seed data for ${DB_NAME}
      -- This file populates the database with test data
  
      USE \`${DB_NAME}\`;
  
      -- ============================================
      -- INSERTION DES UTILISATEURS
      -- ============================================
  
      INSERT INTO users (id, nom, prenom, email, password, role, statut, departement, telephone, bureau) VALUES
      (1, 'Admin', 'Système', 'admin@gestion-etudiants.com', 'admin123', 'admin', 'actif', 'Administration', '+237 690 000 001', 'Bureau A101'),
      (2, 'Mbarga', 'Paul', 'paul.mbarga@gestion-etudiants.com', 'prof123', 'professeur', 'actif', 'Informatique', '+237 691 234 567', 'Bureau B205'),
      (3, 'Ngono', 'Claire', 'claire.ngono@gestion-etudiants.com', 'prof123', 'professeur', 'actif', 'Mathématiques', '+237 692 345 678', 'Bureau B210')
      ON DUPLICATE KEY UPDATE 
        nom = VALUES(nom),
        prenom = VALUES(prenom);
  
  
      `;
  
    const seedDir = path.dirname(SQL_PATH);
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }
    console.log(`✅ Created seed file at ${SQL_PATH}`);
    
    fs.writeFileSync(SQL_PATH, seedSQL, 'utf8');
    console.log(`✅ Created seed file at ${SQL_PATH}`);
  }
  
  const mysqlArgs = ['-h', DB_HOST, '-u', DB_USER];
  if (DB_PASSWORD) {
    mysqlArgs.push('-p' + DB_PASSWORD);
  }
  mysqlArgs.push(DB_NAME);
  
  console.log('🌱 Seeding database:', DB_NAME);
  console.log('🔧 Launching mysql client...');
  
  const mysql = spawn('mysql', mysqlArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  
  let sql = fs.readFileSync(SQL_PATH, { encoding: 'utf8' });
  
  // Replace database name in SQL with DB_NAME from .env
  sql = sql.replace(/USE\s+[`']?\w+[`']?/i, `USE \`${DB_NAME}\``);
  
  // Temporarily disable foreign key checks
  sql = `SET FOREIGN_KEY_CHECKS=0;\n${sql}\nSET FOREIGN_KEY_CHECKS=1;`;
  
  mysql.stdin.write(sql);
  mysql.stdin.end();
  
  mysql.on('close', code => {
    if (code === 0) {
      console.log('✅ Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log('   - 3 Users (1 admin, 2 professors)');
      console.log('   - 12 Students (across 5 different programs)');
      console.log('   - 12 Courses (various subjects)');
      console.log('   - Multiple enrollments and grades');
      console.log('\n🔑 Login credentials:');
      console.log('   Admin: admin@gestion-etudiants.com / admin123');
      console.log('   Prof:  paul.mbarga@gestion-etudiants.com / prof123');
      console.log('   Prof:  claire.ngono@gestion-etudiants.com / prof123');
    } else {
      console.error('✖ mysql exited with code', code);
    }
  });
  
  mysql.on('error', err => {
    console.error('✖ Failed to start mysql client. Is it installed and on PATH?');
    console.error(err);
    process.exit(1);
  });

}