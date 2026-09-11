export const API_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/** Error de API con código HTTP para distinguir 401 de fallos de red. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Intenta extraer un mensaje legible de una respuesta HTTP fallida.
 * Soporta cuerpos JSON con message (string o array de class-validator)
 * y cuerpos no-JSON (p. ej. HTML de error 500).
 */
export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data === 'string' && data) return data;
    if (data && typeof data.message === 'string') return data.message;
    if (data && Array.isArray(data.message)) return data.message.join(', ');
    if (data && typeof data.message === 'object' && data.message !== null) {
      return String(data.message);
    }
  } catch {
    /* cuerpo no JSON */
  }
  try {
    return (await response.text()) || fallback;
  } catch {
    return fallback;
  }
}