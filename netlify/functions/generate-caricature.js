const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

function parseDataUrl(dataUrl) {
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl || "");

  if (!match) {
    throw new Error("Imagem inválida. Envie uma imagem em JPG, PNG ou WEBP.");
  }

  return {
    mimeType: match[1],
    base64: match[2]
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(500, {
      error: "A chave OPENAI_API_KEY ainda não foi configurada no painel da Netlify."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const {
      imageData,
      fileName = "foto.png",
      styleInstruction = "caricatura grotesca elegante em esboço de caderno",
      quality = "medium",
      userNotes = ""
    } = body;

    const parsed = parseDataUrl(imageData);
    const imageBuffer = Buffer.from(parsed.base64, "base64");

    if (imageBuffer.length > 8 * 1024 * 1024) {
      return json(413, { error: "A imagem enviada ultrapassa 8 MB." });
    }

    const safeQuality = ["low", "medium", "high", "auto"].includes(quality)
      ? quality
      : "medium";

    const prompt = [
      "Transforme a foto enviada em uma caricatura de alta qualidade.",
      `Estilo obrigatório: ${styleInstruction}.`,
      "Preserve a quantidade de pessoas, a posição geral dos personagens, roupas principais e composição da foto original.",
      "Mantenha a fisionomia reconhecível, mas exagere de modo artístico nariz, queixo, testa, olhos, expressões e proporções corporais.",
      "Aparência de esboço de caderno, acabamento humorístico sofisticado, textura de papel, linhas expressivas, sem texto escrito na imagem.",
      "Não crie nudez, violência gráfica, símbolos ofensivos ou conteúdo sexual.",
      userNotes ? `Orientação adicional do usuário: ${userNotes}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const formData = new FormData();

    formData.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
    formData.append("prompt", prompt);
    formData.append("quality", safeQuality);
    formData.append("size", "1024x1024");
    formData.append("output_format", "png");

    const blob = new Blob([imageBuffer], { type: parsed.mimeType });
    formData.append("image[]", blob, fileName || "foto.png");

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      const message = result?.error?.message || "Erro ao chamar a API de imagem.";
      return json(response.status, { error: message });
    }

    const imageBase64 = result?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return json(500, { error: "A API respondeu sem imagem em base64." });
    }

    return json(200, {
      imageBase64,
      outputFormat: "png",
      usage: result.usage || null
    });
  } catch (error) {
    return json(500, {
      error: error.message || "Erro interno ao gerar caricatura."
    });
  }
};
