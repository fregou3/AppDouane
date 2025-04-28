const { OpenAI } = require('openai');
require('dotenv').config();

// Initialiser OpenAI avec la clé API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
  try {
    console.log('Clé API OpenAI:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'non définie');
    
    console.log('Envoi d\'une requête test à l\'API OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, test de connexion à l'API OpenAI" }],
      max_tokens: 50
    });
    
    console.log('Réponse reçue de l\'API OpenAI:');
    console.log(JSON.stringify(completion, null, 2));
    console.log('Test réussi!');
  } catch (error) {
    console.error('Erreur lors du test de l\'API OpenAI:');
    console.error(error.message);
    if (error.response) {
      console.error('Détails de l\'erreur:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testOpenAI();
