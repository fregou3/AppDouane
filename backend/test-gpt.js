require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testGPT() {
    const description = "Huile essentielle de lavande - Type: extrait - Source: Lavande fine de Provence";
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Tu es un expert en codes douaniers. Pour le produit décrit, fournis le code douanier le plus approprié avec une brève explication de ton choix. Indique aussi les alternatives possibles si pertinent."
            }, {
                role: "user",
                content: `Quel est le code douanier pour : ${description}?`
            }],
            temperature: 0.7,
            max_tokens: 250
        });
        console.log('Réponse de ChatGPT:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Erreur:', error);
    }
}

testGPT();
