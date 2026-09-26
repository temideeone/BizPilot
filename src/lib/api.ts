/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Safely parse API responses and extract meaningful JSON or text errors.
 * Guarantees that even if an HTTP error (500, 502, 503) returns HTML,
 * it won't crash with "Unexpected token '<', <!doctype..." syntax error.
 */
export async function handleApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    if (isJson) {
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Fallback below
      }
    } else {
      const rawText = await response.text().catch(() => '');
      if (response.status === 503 || rawText.includes('503') || rawText.includes('high demand')) {
        errorMessage = 'The AI service is experiencing temporary high demand. Please try again shortly.';
      } else if (response.status === 429 || rawText.includes('429') || rawText.includes('quota')) {
        errorMessage = 'API rate limit momentarily reached. Please wait a few seconds and try again.';
      } else if (rawText && rawText.length < 300 && !rawText.includes('<!DOCTYPE') && !rawText.includes('<html')) {
        errorMessage = rawText;
      }
    }
    throw new Error(errorMessage);
  }

  if (isJson) {
    return await response.json();
  }
  return (await response.text()) as unknown as T;
}
