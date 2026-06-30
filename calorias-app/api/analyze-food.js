const PROMPT = `Analiza esta foto de comida. Responde SOLO con JSON valido (sin markdown):
{"name":"nombre del plato o alimento en espanol","calories":numero entero de kcal estimadas del plato visible,"protein":numero entero de gramos de proteina estimados,"portion":"porcion estimada ej: 1 plato, 200 g","meal":"desayuno|almuerzo|cena|snack"}
Estima las calorias y proteinas totales de lo que se ve en la foto. Si hay varios alimentos, describe el plato completo.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "IA no configurada. Agrega GROQ_API_KEY en Vercel (Settings > Environment Variables).",
    });
  }

  const { image } = req.body || {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return res.status(400).json({ error: "Imagen invalida" });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: image, detail: "low" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Groq error:", response.status, errBody);
      return res.status(502).json({ error: "No se pudo analizar la imagen. Intenta de nuevo." });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const parsed = parseAiJson(raw);

    if (!parsed) {
      return res.status(502).json({ error: "La IA no devolvio un resultado valido." });
    }

    const calories = Math.round(Number(parsed.calories));
    const protein = Math.max(0, Math.round(Number(parsed.protein) || 0));
    if (!parsed.name || !Number.isFinite(calories) || calories < 1) {
      return res.status(502).json({ error: "No se pudieron estimar las calorias." });
    }

    const validMeals = ["desayuno", "almuerzo", "cena", "snack"];
    const meal = validMeals.includes(parsed.meal) ? parsed.meal : guessMealByHour();

    return res.status(200).json({
      name: String(parsed.name).slice(0, 80),
      calories: Math.min(calories, 5000),
      protein: Math.min(protein, 500),
      portion: String(parsed.portion || "").slice(0, 60),
      meal,
    });
  } catch (error) {
    console.error("analyze-food error:", error);
    return res.status(500).json({ error: "Error interno al analizar la foto." });
  }
}

function parseAiJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function guessMealByHour() {
  const hour = new Date().getHours();
  if (hour < 11) return "desayuno";
  if (hour < 16) return "almuerzo";
  if (hour < 21) return "cena";
  return "snack";
}
