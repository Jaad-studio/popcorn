// Ce fichier permet de cacher la clé API sur Vercel (Serverless Function)
export default async function handler(req, res) {
  // On s'assure que la requête est bien de type POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Vercel va récupérer la clé secrète depuis les "Environment Variables"
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'La clé GEMINI_API_KEY est introuvable sur le serveur Vercel.' });
  }

  const prompt = req.body.prompt;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

  const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { 
          parts: [{ 
              text: "Tu es 'L'Oracle Cinéma', l'expert recommandation de Popcorn TV. L'utilisateur te donne son humeur ou ce qu'il a envie de regarder. Propose exactement 3 films parfaits pour lui. Retourne UNIQUEMENT une liste JSON." 
          }] 
      },
      generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
              type: "ARRAY",
              items: {
                  type: "OBJECT",
                  properties: {
                      titre: { type: "STRING" },
                      annee: { type: "STRING" },
                      emoji: { type: "STRING", description: "Un seul emoji qui représente le film" },
                      synopsis: { type: "STRING", description: "Un synopsis très court et accrocheur d'une phrase" }
                  },
                  required: ["titre", "annee", "emoji", "synopsis"]
              }
          }
      }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la communication avec Gemini.' });
  }
}
