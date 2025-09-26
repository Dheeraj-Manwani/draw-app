import { CanvasElement } from "@/types/canvas";

export class GeminiService {
  private apiKey: string;

  constructor() {
    // Use process.env for Vite environment variables
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    if (!this.apiKey) {
      console.warn("Gemini API key not found in environment variables");
    }
  }

  async generateDrawing(prompt: string): Promise<CanvasElement[]> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured");
    }

    const systemPrompt = `You are an AI assistant that creates drawing elements for a drawing application. 
    
    Based on the user's prompt, generate a JSON array of drawing elements that represent the described scene.
    
    Each element should be a JSON object with the following structure:
    {
      "id": "unique-id",
      "type": "rectangle" | "ellipse" | "line" | "arrow" | "freehand" | "text" | "diamond",
      "x": number (position from left),
      "y": number (position from top),
      "width": number,
      "height": number,
      "angle": 0,
      "strokeColor": "#000000",
      "fillColor": "transparent" | "#ffffff" | color,
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "opacity": 1,
      "locked": false,
      "zIndex": number (higher = on top),
      "data": {}
    }
    
    For text elements, also include:
    - "text": "the text content"
    - "fontSize": 16
    - "fontWeight": "normal" | "bold"
    
    Guidelines:
    - Use a canvas size of approximately 800x600
    - Position elements logically within this space
    - Use appropriate colors (hex format like "#ff0000")
    - Make elements proportional and well-spaced
    - For complex shapes, break them into simpler elements
    - Use text elements for labels when needed
    - Set zIndex to layer elements properly (background elements = lower numbers)
    
    Return ONLY the JSON array, no other text or formatting.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nUser prompt: ${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}. ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini API");
      }

      const generatedText = data.candidates[0].content.parts[0].text;

      // Clean up the response text (remove markdown code blocks if present)
      const cleanedText = generatedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Parse the JSON response
      const elements = JSON.parse(cleanedText);

      // Validate and enhance the elements
      return this.validateAndEnhanceElements(elements);
    } catch (error) {
      console.error("Error generating drawing with Gemini:", error);
      throw new Error(
        `Failed to generate drawing: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private validateAndEnhanceElements(elements: any[]): CanvasElement[] {
    if (!Array.isArray(elements)) {
      throw new Error("Invalid response format: expected an array of elements");
    }

    return elements.map((element, index) => {
      // Ensure required properties exist with defaults
      const enhancedElement: CanvasElement = {
        id: element.id || `generated-${Date.now()}-${index}`,
        type: element.type || "rectangle",
        x: typeof element.x === "number" ? element.x : 100,
        y: typeof element.y === "number" ? element.y : 100,
        width:
          typeof element.width === "number" ? Math.max(10, element.width) : 100,
        height:
          typeof element.height === "number"
            ? Math.max(10, element.height)
            : 100,
        angle: typeof element.angle === "number" ? element.angle : 0,
        strokeColor: element.strokeColor || "#000000",
        fillColor: element.fillColor || "transparent",
        strokeWidth:
          typeof element.strokeWidth === "number" ? element.strokeWidth : 2,
        strokeStyle: element.strokeStyle || "solid",
        opacity: typeof element.opacity === "number" ? element.opacity : 1,
        locked: Boolean(element.locked),
        zIndex: typeof element.zIndex === "number" ? element.zIndex : index,
        data: element.data || {},
      };

      // Add text-specific properties if it's a text element
      if (element.type === "text") {
        enhancedElement.text = element.text || "";
        enhancedElement.fontSize = element.fontSize || 16;
        enhancedElement.fontWeight = element.fontWeight || "normal";
      }

      return enhancedElement;
    });
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
