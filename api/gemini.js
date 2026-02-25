// Ce fichier doit être dans un dossier nommé "api" à la racine de ton projet Vercel.
// Dans Vercel Settings > Environment Variables, ajoute GEMINI_API_KEY avec ta clé.
export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  // Utilisation de gemini-1.5-flash pour la rapidité
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Seule la méthode POST est acceptée.' });
  }

  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Requête vide.' });
  }

  // Prompt système pour garantir une réponse structurée en JSON
  const systemPrompt = "Tu es 'Popcorn AI'. L'utilisateur te demande un film ou une série. Réponds UNIQUEMENT avec un JSON pur de 3 recommandations réelles. Format: [{ 'titre': 'Nom', 'annee': 'Année', 'synopsis': 'Résumé ultra court (15 mots max)', 'emoji': 'Emoji' }]. Pas de texte superflu avant ou après.";

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Demande utilisateur: ${query}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { 
            responseMimeType: "application/json",
            temperature: 0.7 
        }
      })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini Error:", errorData);
        return res.status(500).json({ error: "Erreur lors de l'appel à Gemini." });
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;
    
    // On renvoie l'objet JSON parsé au site
    return res.status(200).json(JSON.parse(resultText));
  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Erreur interne du serveur Vercel." });
  }
}
