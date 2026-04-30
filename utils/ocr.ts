import * as FileSystem from 'expo-file-system';
import { OcrResult } from './types';

const OCR_ENDPOINT = process.env.EXPO_PUBLIC_OCR_ENDPOINT || '';
const OCR_API_KEY = process.env.EXPO_PUBLIC_OCR_API_KEY || '';

type VisionResponse = {
  responses?: Array<{
    fullTextAnnotation?: { text?: string };
    textAnnotations?: Array<{ description?: string }>;
    error?: { message?: string };
  }>;
};

function extractAmount(text: string): number | undefined {
  const matches = Array.from(text.matchAll(/(?:USD|\$)?\s*(\d{1,6}(?:\.\d{2})?)/g));
  if (!matches.length) {
    return undefined;
  }

  const numbers = matches
    .map((match) => Number(match[1]))
    .filter((value) => !Number.isNaN(value));

  return numbers.length ? Math.max(...numbers) : undefined;
}

function toIsoDate(year: string, month: string, day: string): string {
  const yyyy = year.padStart(4, '20');
  const mm = month.padStart(2, '0');
  const dd = day.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function extractDate(text: string): string | undefined {
  const isoMatch = text.match(/(20\d{2})[-\/.](0?[1-9]|1[0-2])[-\/.](0?[1-9]|[12]\d|3[01])/);
  if (isoMatch) {
    return toIsoDate(isoMatch[1], isoMatch[2], isoMatch[3]);
  }

  const usMatch = text.match(/(0?[1-9]|1[0-2])[-\/.](0?[1-9]|[12]\d|3[01])[-\/.](\d{2,4})/);
  if (usMatch) {
    const year = usMatch[3].length === 2 ? `20${usMatch[3]}` : usMatch[3];
    return toIsoDate(year, usMatch[1], usMatch[2]);
  }

  return undefined;
}

function extractMerchant(text: string): string | undefined {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 1);
  return firstLine || undefined;
}

export async function runOcrOnImage(imageUri: string): Promise<OcrResult> {
  if (!OCR_ENDPOINT || !OCR_API_KEY) {
    return {};
  }

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const response = await fetch(`${OCR_ENDPOINT}?key=${OCR_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'TEXT_DETECTION' }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OCR failed with status ${response.status}`);
  }

  const data = (await response.json()) as VisionResponse;
  const first = data.responses?.[0];
  if (!first) {
    return {};
  }

  if (first.error?.message) {
    throw new Error(first.error.message);
  }

  const rawText =
    first.fullTextAnnotation?.text ||
    first.textAnnotations?.[0]?.description ||
    '';

  const normalizedText = rawText.replace(/\s+/g, ' ').trim();

  return {
    amount: extractAmount(normalizedText),
    date: extractDate(rawText),
    merchant: extractMerchant(rawText),
  };
}
