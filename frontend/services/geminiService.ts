import { GoogleGenAI, Type } from "@google/genai";
import { Specialty, TriageResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const getAiClient = () => {
  if (!apiKey) {
    console.warn("VITE_GEMINI_API_KEY no configurada. Se usará el modo local.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getLocalTriageResult = (symptoms: string): TriageResult => {
  const text = normalize(symptoms);

  const emergencyPatterns = [
    'falta de aire', 'dificultad respiratoria', 'dolor fuerte al pecho', 'desmayo', 'sangrado abundante',
    'convulsiones', 'dolor intenso', 'inconsciente', 'cefalea intensa'
  ];

  const pediatricPatterns = ['niño', 'nina', 'bebé', 'infantil', 'infancia'];
  const gynecologyPatterns = ['embarazo', 'sangrado menstrual', 'dolor pélvico', 'ovario', 'vaginal'];
  const dermatologyPatterns = ['erupcion', 'picazon', 'comezon', 'rash', 'hinchazon', 'urticaria'];
  const neurologyPatterns = ['mareo', 'debilidad', 'confusion', 'dolor de cabeza', 'convulsion', 'temblor'];
  const traumaPatterns = ['caida', 'fractura', 'esguince', 'trauma', 'accidente'];

  const hasAny = (patterns: string[]) => patterns.some((pattern) => text.includes(pattern));

  if (hasAny(emergencyPatterns)) {
    return {
      recommendedSpecialty: Specialty.GENERAL,
      urgency: 'Alta',
      reasoning: 'Se detectan síntomas potencialmente urgentes. Requiere valoración médica urgente o atención inmediata.',
    };
  }

  if (hasAny(pediatricPatterns)) {
    return {
      recommendedSpecialty: Specialty.PEDIATRICS,
      urgency: 'Media',
      reasoning: 'Los síntomas apuntan a una consulta pediátrica para evaluación apropiada del niño o adolescente.',
    };
  }

  if (hasAny(gynecologyPatterns)) {
    return {
      recommendedSpecialty: Specialty.GYNECOLOGY,
      urgency: 'Media',
      reasoning: 'Se recomienda valoración ginecológica para evaluar los síntomas reportados.',
    };
  }

  if (hasAny(dermatologyPatterns)) {
    return {
      recommendedSpecialty: Specialty.DERMATOLOGY,
      urgency: 'Baja',
      reasoning: 'Los síntomas son compatibles con una consulta dermatológica.',
    };
  }

  if (hasAny(neurologyPatterns)) {
    return {
      recommendedSpecialty: Specialty.NEUROLOGY,
      urgency: 'Media',
      reasoning: 'Existe sospecha de síntomas neurológicos y se recomienda evaluación especializada.',
    };
  }

  if (hasAny(traumaPatterns)) {
    return {
      recommendedSpecialty: Specialty.TRAUMATOLOGY,
      urgency: 'Media',
      reasoning: 'Los síntomas sugieren una lesión o trauma que requiere revisión traumatológica.',
    };
  }

  return {
    recommendedSpecialty: Specialty.GENERAL,
    urgency: 'Baja',
    reasoning: 'Modo local: se recomienda una consulta médica general y seguimiento si los síntomas persisten.',
  };
};

export const analyzeSymptoms = async (symptoms: string): Promise<TriageResult> => {
  const ai = getAiClient();
  if (!ai) {
    return getLocalTriageResult(symptoms);
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Analiza los siguientes síntomas de un paciente y recomienda la especialidad médica más adecuada del sistema de salud público argentino/chileno.
    Síntomas: "${symptoms}"
    
    Las especialidades disponibles son: ${Object.values(Specialty).join(', ')}.
    
    Responde en formato JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedSpecialty: {
              type: Type.STRING,
              enum: Object.values(Specialty),
              description: "La especialidad médica recomendada."
            },
            urgency: {
              type: Type.STRING,
              enum: ['Baja', 'Media', 'Alta'],
              description: "Nivel de urgencia estimado."
            },
            reasoning: {
              type: Type.STRING,
              description: "Breve explicación de por qué se eligió esa especialidad (máximo 20 palabras)."
            }
          },
          required: ['recommendedSpecialty', 'urgency', 'reasoning']
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini");
    }

    const parsed = JSON.parse(resultText) as TriageResult;
    return parsed;

  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    return getLocalTriageResult(symptoms);
  }
};