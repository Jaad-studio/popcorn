export default async function handler(req, res) {
  // On accepte uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // Vérification de la configuration serveur
  if (!apiKey) {
    return res.status(500).json({ error: 'Erreur de configuration : GEMINI_API_KEY est manquante sur Vercel.' });
  }

  // Instructions pour l'IA
  const systemPrompt = "Tu es 'Popcorn AI'. L'utilisateur te donne ses envies de films ou séries. " +
    "Réponds avec exactement 3 recommandations existantes au format JSON : " +
    "un tableau d'objets contenant les clés 'titre', 'annee', 'synopsis' (court) et 'emoji'. " +
    "Ne renvoie absolument rien d'autre que le JSON pur.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `L'utilisateur veut : ${prompt}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Erreur API Google Gemini', details: errorData });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('Aucun contenu généré par l\'IA.');
    }

    // On parse la chaîne de caractères JSON renvoyée par l'IA pour l'envoyer comme un vrai objet JSON
    const movieData = JSON.parse(resultText);
    
    // On renvoie les données au front-end
    return res.status(200).json(movieData);

  } catch (error) {
    console.error('Erreur Backend:', error);
    return res.status(500).json({ error: 'Erreur serveur lors de la génération des recommandations.' });
  }
}
