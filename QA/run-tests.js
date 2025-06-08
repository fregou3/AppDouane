/**
 * Script pour exécuter les tests QA et générer un rapport
 * 
 * Ce script exécute les tests QA et génère un rapport HTML des résultats
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testCommand: 'npx jest',
  reportDir: './reports',
  reportFile: 'test-report.html',
  summaryFile: 'test-summary.json'
};

// Créer le répertoire de rapports s'il n'existe pas
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

// Fonction pour exécuter les tests
function runTests() {
  console.log('Exécution des tests QA...');
  
  try {
    // Exécuter les tests avec Jest
    const output = execSync(`${config.testCommand} --json --outputFile=${path.join(config.reportDir, config.summaryFile)}`, { 
      encoding: 'utf8',
      stdio: 'inherit' 
    });
    
    console.log('Tests terminés avec succès.');
    return true;
  } catch (error) {
    console.log('Certains tests ont échoué, mais le rapport sera quand même généré.');
    return false;
  }
}

// Fonction pour générer un rapport HTML
function generateReport() {
  console.log('Génération du rapport HTML...');
  
  try {
    // Lire le fichier de résultats JSON
    const summaryPath = path.join(config.reportDir, config.summaryFile);
    if (!fs.existsSync(summaryPath)) {
      console.error('Le fichier de résultats de test n\'existe pas.');
      return false;
    }
    
    const testResults = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    
    // Calculer les statistiques
    const stats = {
      numPassedTests: testResults.numPassedTests || 0,
      numFailedTests: testResults.numFailedTests || 0,
      numTotalTests: testResults.numTotalTests || 0,
      numPendingTests: testResults.numPendingTests || 0,
      startTime: testResults.startTime,
      endTime: testResults.endTime
    };
    
    // Générer le contenu HTML
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Tests QA - Application Douane</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .summary {
      background-color: #f8f9fa;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .stats {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .stat-box {
      background-color: #fff;
      border-radius: 5px;
      padding: 15px;
      margin: 10px 0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      flex-basis: 23%;
      text-align: center;
    }
    .passed { color: #27ae60; }
    .failed { color: #e74c3c; }
    .pending { color: #f39c12; }
    .total { color: #2980b9; }
    .test-suite {
      background-color: #fff;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .test-suite h3 {
      margin-top: 0;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .test-case {
      padding: 10px;
      margin: 5px 0;
      border-radius: 3px;
    }
    .test-case.pass { background-color: #e8f5e9; }
    .test-case.fail { background-color: #ffebee; }
    .test-case.pending { background-color: #fff8e1; }
    .error-details {
      background-color: #f8f9fa;
      padding: 10px;
      border-left: 3px solid #e74c3c;
      margin-top: 10px;
      font-family: monospace;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .timestamp {
      color: #7f8c8d;
      font-size: 0.9em;
    }
    .progress-bar {
      height: 20px;
      background-color: #ecf0f1;
      border-radius: 10px;
      margin: 20px 0;
      overflow: hidden;
    }
    .progress {
      height: 100%;
      background-color: #2ecc71;
      border-radius: 10px;
      transition: width 0.5s ease-in-out;
    }
  </style>
</head>
<body>
  <h1>Rapport de Tests QA - Application Douane</h1>
  <p class="timestamp">Généré le ${new Date().toLocaleString()}</p>
  
  <div class="summary">
    <h2>Résumé</h2>
    <div class="stats">
      <div class="stat-box passed">
        <h3>Réussis</h3>
        <p>${stats.numPassedTests}</p>
      </div>
      <div class="stat-box failed">
        <h3>Échoués</h3>
        <p>${stats.numFailedTests}</p>
      </div>
      <div class="stat-box pending">
        <h3>En attente</h3>
        <p>${stats.numPendingTests}</p>
      </div>
      <div class="stat-box total">
        <h3>Total</h3>
        <p>${stats.numTotalTests}</p>
      </div>
    </div>
    
    <div class="progress-bar">
      <div class="progress" style="width: ${(stats.numPassedTests / stats.numTotalTests) * 100}%"></div>
    </div>
    
    <p>Durée des tests: ${((stats.endTime - stats.startTime) / 1000).toFixed(2)} secondes</p>
  </div>
  
  <h2>Détails des tests</h2>
  
  ${testResults.testResults.map(suite => `
    <div class="test-suite">
      <h3>${suite.name.replace(/^.*[\\/]/, '')}</h3>
      <p>Statut: ${suite.status}</p>
      
      ${suite.assertionResults.map(test => `
        <div class="test-case ${test.status === 'passed' ? 'pass' : test.status === 'failed' ? 'fail' : 'pending'}">
          <h4>${test.title}</h4>
          <p>Statut: ${test.status === 'passed' ? 'Réussi' : test.status === 'failed' ? 'Échoué' : 'En attente'}</p>
          ${test.failureMessages && test.failureMessages.length > 0 ? 
            `<div class="error-details">${test.failureMessages.join('\n')}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <footer>
    <p>Tests exécutés avec Jest</p>
  </footer>
</body>
</html>
    `;
    
    // Écrire le rapport HTML
    fs.writeFileSync(path.join(config.reportDir, config.reportFile), html);
    
    console.log(`Rapport HTML généré avec succès: ${path.join(config.reportDir, config.reportFile)}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la génération du rapport HTML:', error);
    return false;
  }
}

// Exécuter les tests et générer le rapport
console.log('Démarrage des tests QA et génération du rapport...');
const testsSucceeded = runTests();
const reportGenerated = generateReport();

if (reportGenerated) {
  console.log(`\nRapport disponible à l'adresse: ${path.join(config.reportDir, config.reportFile)}`);
}

process.exit(testsSucceeded ? 0 : 1);
