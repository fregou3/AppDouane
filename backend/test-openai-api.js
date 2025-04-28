/**
 * Script pour tester la validité de la clé API OpenAI
 */
require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

async function testOpenAIAPI() {
  console.log('Test de la clé API OpenAI...');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurée (masquée pour des raisons de sécurité)' : 'Non configurée');
  console.log('CHAT_MODEL:', process.env.CHAT_MODEL || 'Non configuré');
  
  try {
    // Créer une instance du modèle ChatOpenAI
    const model = new ChatOpenAI({
      modelName: process.env.CHAT_MODEL || 'gpt-3.5-turbo',
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY
    });
    
    // Tester l'API avec une requête simple
    console.log('\nEnvoi d\'une requête de test à l\'API OpenAI...');
    const messages = [
      { role: 'system', content: 'Vous êtes un assistant utile.' },
      { role: 'user', content: 'Bonjour, ceci est un test. Répondez simplement "OK" si vous recevez ce message.' }
    ];
    
    const response = await model.call(messages);
    
    console.log('\nRéponse reçue de l\'API OpenAI:');
    console.log(response.content);
    
    console.log('\n✅ Test réussi! La clé API OpenAI est valide et fonctionne correctement.');
    return true;
  } catch (error) {
    console.error('\n❌ Erreur lors du test de la clé API OpenAI:');
    console.error(error.message);
    
    if (error.message.includes('401')) {
      console.error('\nLa clé API semble être invalide ou expirée. Veuillez vérifier votre clé API dans le fichier .env.');
    } else if (error.message.includes('429')) {
      console.error('\nVous avez dépassé votre quota d\'utilisation de l\'API OpenAI. Veuillez vérifier votre plan d\'abonnement.');
    } else if (error.message.includes('503')) {
      console.error('\nLe service OpenAI est temporairement indisponible. Veuillez réessayer plus tard.');
    }
    
    return false;
  }
}

// Exécuter le test
testOpenAIAPI();
