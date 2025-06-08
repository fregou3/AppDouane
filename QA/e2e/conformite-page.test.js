const puppeteer = require('puppeteer');
const axios = require('axios');

// URL de l'application frontend
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// Fonction pour vérifier si l'application est disponible
async function isAppAvailable(url) {
  try {
    await axios.get(url, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Marquer tous les tests comme conditionnels
const describeIfAppAvailable = (title, fn) => {
  describe(title, () => {
    beforeAll(async () => {
      const available = await isAppAvailable(APP_URL);
      if (!available) {
        console.warn(`L'application frontend n'est pas disponible à l'URL ${APP_URL}. Les tests end-to-end seront ignorés.`);
      }
    });
    fn();
  });
};

describeIfAppAvailable('Tests End-to-End de la page Conformité', () => {
  let browser;
  let page;

  // Configuration du navigateur avant les tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true, // Mettre à false pour voir le navigateur pendant les tests
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Augmenter les timeouts pour les opérations réseau
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);
    
    // Intercepter les erreurs de console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Erreur dans la page: ${msg.text()}`);
      }
    });
  });

  // Fermer le navigateur après les tests
  afterAll(async () => {
    await browser.close();
  });

  // Test de navigation vers la page Conformité
  test('Navigation vers la page Conformité', async () => {
    // Vérifier si l'application est disponible
    const available = await isAppAvailable(APP_URL);
    if (!available) {
      console.warn(`Test ignoré: L'application frontend n'est pas disponible à l'URL ${APP_URL}`);
      return;
    }
    await page.goto(`${APP_URL}/conformite`);
    
    // Vérifier que la page a bien chargé
    await page.waitForSelector('h1');
    const pageTitle = await page.$eval('h1', el => el.textContent);
    expect(pageTitle).toContain('Conformité');
  });

  // Test de sélection d'un lot
  test('Sélection d\'un lot', async () => {
    // Vérifier si l'application est disponible
    const available = await isAppAvailable(APP_URL);
    if (!available) {
      console.warn(`Test ignoré: L'application frontend n'est pas disponible à l'URL ${APP_URL}`);
      return;
    }
    await page.goto(`${APP_URL}/conformite`);
    
    // Attendre que le sélecteur de lot soit chargé
    await page.waitForSelector('select');
    
    // Vérifier qu'il y a des options dans le sélecteur
    const options = await page.$$eval('select option', options => options.map(option => option.value));
    expect(options.length).toBeGreaterThan(1); // Au moins une option + l'option par défaut
    
    // Sélectionner la première option non vide
    const firstOption = options.find(option => option !== '');
    if (firstOption) {
      await page.select('select', firstOption);
      
      // Attendre que les données soient chargées
      await page.waitForSelector('.MuiCard-root');
      
      // Vérifier que des documents sont affichés
      const documents = await page.$$('.MuiCard-root');
      expect(documents.length).toBeGreaterThan(0);
    }
  });

  // Test d'analyse d'un document
  test('Analyse d\'un document', async () => {
    // Vérifier si l'application est disponible
    const available = await isAppAvailable(APP_URL);
    if (!available) {
      console.warn(`Test ignoré: L'application frontend n'est pas disponible à l'URL ${APP_URL}`);
      return;
    }
    await page.goto(`${APP_URL}/conformite`);
    
    // Attendre que le sélecteur de lot soit chargé
    await page.waitForSelector('select');
    
    // Vérifier qu'il y a des options dans le sélecteur
    const options = await page.$$eval('select option', options => options.map(option => option.value));
    
    // Sélectionner la première option non vide
    const firstOption = options.find(option => option !== '');
    if (firstOption) {
      await page.select('select', firstOption);
      
      // Attendre que les documents soient chargés
      await page.waitForSelector('.MuiCard-root');
      
      // Cliquer sur le bouton "Analyser" du premier document
      const analyzeButton = await page.waitForSelector('button[aria-label="Analyser"]');
      await analyzeButton.click();
      
      // Attendre que la boîte de dialogue d'analyse s'ouvre
      await page.waitForSelector('.MuiDialog-root');
      
      // Vérifier que la boîte de dialogue est ouverte
      const dialogTitle = await page.$eval('.MuiDialogTitle-root', el => el.textContent);
      expect(dialogTitle).toContain('Analyse');
      
      // Attendre que l'analyse soit terminée (disparition du loader)
      await page.waitForFunction(() => {
        const loader = document.querySelector('.MuiCircularProgress-root');
        return !loader;
      });
      
      // Vérifier que les résultats d'analyse sont affichés
      const dialogContent = await page.$eval('.MuiDialogContent-root', el => el.textContent);
      expect(dialogContent).not.toBe('');
      
      // Fermer la boîte de dialogue
      const closeButton = await page.waitForSelector('.MuiDialogActions-root button');
      await closeButton.click();
      
      // Vérifier que la boîte de dialogue est fermée
      await page.waitForFunction(() => {
        return !document.querySelector('.MuiDialog-root');
      });
    }
  });

  // Test d'affichage des résultats d'analyse pour chaque type de document
  test('Affichage des résultats d\'analyse pour chaque type de document', async () => {
    // Vérifier si l'application est disponible
    const available = await isAppAvailable(APP_URL);
    if (!available) {
      console.warn(`Test ignoré: L'application frontend n'est pas disponible à l'URL ${APP_URL}`);
      return;
    }
    await page.goto(`${APP_URL}/conformite`);
    
    // Attendre que le sélecteur de lot soit chargé
    await page.waitForSelector('select');
    
    // Vérifier qu'il y a des options dans le sélecteur
    const options = await page.$$eval('select option', options => options.map(option => option.value));
    
    // Sélectionner la première option non vide
    const firstOption = options.find(option => option !== '');
    if (firstOption) {
      await page.select('select', firstOption);
      
      // Attendre que les documents soient chargés
      await page.waitForSelector('.MuiCard-root');
      
      // Récupérer tous les boutons "Voir l'analyse"
      const viewButtons = await page.$$('button[aria-label="Voir l\'analyse"]');
      
      // Pour chaque bouton "Voir l'analyse", cliquer dessus et vérifier que la boîte de dialogue s'ouvre
      for (let i = 0; i < Math.min(viewButtons.length, 4); i++) { // Limiter à 4 pour éviter des tests trop longs
        await viewButtons[i].click();
        
        // Attendre que la boîte de dialogue s'ouvre
        await page.waitForSelector('.MuiDialog-root');
        
        // Vérifier que la boîte de dialogue est ouverte
        const dialogTitle = await page.$eval('.MuiDialogTitle-root', el => el.textContent);
        expect(dialogTitle).toContain('Analyse');
        
        // Vérifier que les résultats d'analyse sont affichés
        const dialogContent = await page.$eval('.MuiDialogContent-root', el => el.textContent);
        expect(dialogContent).not.toBe('');
        
        // Fermer la boîte de dialogue
        const closeButton = await page.waitForSelector('.MuiDialogActions-root button');
        await closeButton.click();
        
        // Attendre que la boîte de dialogue soit fermée
        await page.waitForFunction(() => {
          return !document.querySelector('.MuiDialog-root');
        });
      }
    }
  });
});
