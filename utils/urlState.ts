import LZString from 'lz-string';
import { ArticleSummary, FullArticle } from '../types';

// Compress JSON object to a URL-safe string
export const compressState = (data: any): string => {
  try {
    const jsonString = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(jsonString);
  } catch (e) {
    console.error("Compression failed", e);
    return "";
  }
};

// Decompress URL string back to object
export const decompressState = <T>(encodedString: string): T | null => {
  try {
    if (!encodedString) return null;
    const jsonString = LZString.decompressFromEncodedURIComponent(encodedString);
    if (!jsonString) return null;
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error("Decompression failed", e);
    return null;
  }
};

// Update browser URL without reloading
export const updateUrl = (params: Record<string, string | null>) => {
  const url = new URL(window.location.href);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  window.history.pushState({}, '', url.toString());
};