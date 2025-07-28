

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Coordinates } from '../types';

// In a Vite app, the correct way to access environment variables is `import.meta.env`.
// The variable must be prefixed with `VITE_` to be exposed to the client.
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    // Updated error message to reflect the correct variable name.
    throw new Error("A chave da API do Gemini (VITE_GEMINI_API_KEY) não foi encontrada. Verifique suas variáveis de ambiente.");
}

// Assuming API_KEY is provided in the environment as per the guidelines.
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates a creative description for an image using Gemini.
 * @param base64Image The base64 encoded image string.
 * @returns A promise that resolves to the generated description string.
 */
export const generateDescriptionFromImage = async (base64Image: string): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    const textPart = {
      text: "Descreva a atmosfera deste lugar em uma frase curta e contagiante para um app de eventos. Seja informal e use gírias brasileiras se apropriado. Foque na energia e no que está acontecendo."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key')) {
        throw new Error("A chave da API do Gemini não está configurada ou é inválida.");
    }
    throw new Error("Não foi possível gerar a descrição. Tente novamente.");
  }
};

/**
 * Gets coordinates for a given location string using Gemini with Google Search.
 * @param locationName The name of the location (e.g., "Eiffel Tower, Paris").
 * @returns A promise that resolves to a Coordinates object.
 */
export const getCoordinatesForLocation = async (locationName: string): Promise<Coordinates> => {
    try {
        const prompt = `Encontre as coordenadas de latitude e longitude para o seguinte local: "${locationName}". Responda apenas com um objeto JSON contendo as chaves "lat" e "lng". Exemplo: {"lat": 48.8584, "lng": 2.2945}`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // The response text needs to be cleaned and parsed
        let textResponse = response.text.trim();
        const jsonMatch = textResponse.match(/{[^]*}/);
        if (jsonMatch) {
          textResponse = jsonMatch[0];
        }
        
        const parsed = JSON.parse(textResponse);
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
            return { lat: parsed.lat, lng: parsed.lng };
        } else {
            throw new Error("Resposta da API de geolocalização em formato inesperado.");
        }

    } catch (error) {
        console.error("Error getting coordinates from Gemini:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Não foi possível analisar a resposta de geolocalização. Tente um local mais específico.");
        }
        throw new Error("Não foi possível encontrar as coordenadas para este local. Tente novamente.");
    }
};