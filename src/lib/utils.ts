import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getContentDirection(text: string): 'ltr' | 'rtl' {
  if (!text) return 'ltr';
  const hebrewPattern = /[\u0590-\u05FF]/;
  const firstChars = text.slice(0, 100);
  return hebrewPattern.test(firstChars) ? 'rtl' : 'ltr';
}
