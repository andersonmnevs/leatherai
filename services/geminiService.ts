
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// --- CONFIGURAÇÃO DA API ---
const getApiKey = () => {
  // Prioriza variável de ambiente (padrão React), depois tenta hardcoded se necessário
  return process.env.REACT_APP_GEMINI_API_KEY || process.env.API_KEY || "";
};

// Função simples para validar se a chave está funcionando (sem imagem)
export const testGeminiConnection = async (): Promise<boolean> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key não encontrada");

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    // Teste simples de geração de texto
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: "Hello" }] }
    });
    return !!response;
  } catch (error) {
    console.error("Teste de conexão falhou:", error);
    throw error;
  }
};

// PARA A IA: Alta Resolução + PNG Lossless
export const processImageForAI = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // ULTRA RESOLUÇÃO: 3072px (3K)
      // Necessário para identificar furos milimétricos com precisão de pixel.
      const maxDim = 3072; 

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Habilita suavização de alta qualidade para o resize
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // MUDANÇA CRÍTICA: PNG (Lossless) em vez de JPEG.
        // Garante que as bordas do furo não fiquem borradas por artefatos de compressão.
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl); 
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = (error) => reject(error);
  });
};

// PARA O BANCO DE DADOS: Média Resolução + JPG Otimizado
// Isso garante que o arquivo fique abaixo de 1MB (limite do Firestore)
export const processImageForStorage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resolução padrão para visualização Web (HD)
        const maxDim = 1024; 
  
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }
  
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // JPG com compressão 0.7 gera arquivos ~150kb, perfeitos para Firestore
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl); 
        } else {
          reject(new Error("Could not get canvas context"));
        }
      };
      img.onerror = (error) => reject(error);
    });
  };

export const analyzeLeatherImage = async (fileOrBase64: File | string): Promise<AnalysisResult> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Gemini API Key não encontrada. Configure o arquivo .env");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  console.log("Preparando imagem para IA...");
  
  let base64Data = "";
  if (typeof fileOrBase64 === 'string') {
     base64Data = fileOrBase64;
  } else {
     base64Data = await processImageForAI(fileOrBase64);
  }

  // Strip prefix for Gemini API
  const rawBase64 = base64Data.split(',')[1];

  console.log("Imagem pronta. Iniciando requisição...");

  // Schema Atualizado para incluir Bounding Boxes
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      quality: {
        type: Type.STRING,
        description: "A classificação técnica do couro. Use ESTRITAMENTE um destes valores: 'TR1', 'TR2', 'TR3', 'TR4' ou 'R' (para Refugo/Rejeito).",
      },
      defects_visual: {
        type: Type.ARRAY,
        description: "Lista de defeitos encontrados com localização visual.",
        items: {
            type: Type.OBJECT,
            properties: {
                type: { 
                    type: Type.STRING, 
                    description: "Nome do defeito em Português (ex: Risco, Furo, Marca de fogo, Carrapato, Cicatriz Aberta)" 
                },
                box_2d: {
                    type: Type.ARRAY,
                    description: "Coordenadas [ymin, xmin, ymax, xmax] na escala 0-1000. O retângulo deve ser JUSTO (shrink-wrapped) ao defeito, sem margens extras.",
                    items: { type: Type.INTEGER }
                }
            }
        }
      },
      defects_detected: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Lista simples (apenas texto) de todos os tipos de defeitos encontrados.",
      },
      confidence_level: {
        type: Type.NUMBER,
        description: "Nível de confiança entre 0.0 e 1.0 sobre a avaliação.",
      },
      description: {
        type: Type.STRING,
        description: "Um resumo profissional e curto sobre a condição do couro em Português.",
      },
    },
    required: ["quality", "defects_visual", "defects_detected", "confidence_level", "description"],
  };

  const model = "gemini-2.5-flash"; 
  
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout: A análise demorou mais de 60 segundos.")), 60000)
    );

    const promptText = `
      Atue como um Especialista em Controle de Qualidade de Couro (Visão Computacional).
      
      TAREFA: Detectar e delimitar defeitos físicos na pele com PRECISÃO PIXEL-PERFECT.

      INSTRUÇÕES CRÍTICAS PARA BOUNDING BOXES (0-1000):
      1. **FUROS (HOLES):**
         - O alvo é o "VAZIO" (ONDE O COURO TERMINA E VÊ-SE O FUNDO/MESA).
         - Procure por Alto Contraste Negativo (Bordas escuras/definidas).
         - A caixa delimitadora deve contornar EXATAMENTE a borda do buraco.
         - NÃO inclua a área ao redor. Apenas o buraco.
      
      2. **PRECISÃO:**
         - Use coordenadas 'Shrink-Wrap': A caixa deve estar colada no defeito.
         - Se o defeito é pequeno (ex: 5px), a caixa deve ser pequena (ex: 5px). Não gere caixas grandes genéricas.
      
      3. **DIFERENCIAÇÃO:**
         - Distinga Furos reais (bordas nítidas) de sombras suaves.
      
      4. **CLASSIFICAÇÃO (ABNT/CICB):**
         - TR1/TR2: Aproveitamento > 90%.
         - TR3/TR4: Aproveitamento 60-80%.
         - R (Refugo): Aproveitamento < 50% ou defeitos estruturais graves.

      Retorne o JSON preenchido.
    `;

    const apiCallPromise = ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: rawBase64,
              mimeType: "image/png", // PNG Lossless
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.0,
      },
    });

    const response: any = await Promise.race([apiCallPromise, timeoutPromise]);

    console.log("Resposta bruta da API:", response.text);

    if (response.text) {
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '');
      }
      
      const jsonResult = JSON.parse(cleanText) as AnalysisResult;
      return jsonResult;
    } else {
      throw new Error("A API retornou vazio.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
