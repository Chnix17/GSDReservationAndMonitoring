// src/utils/sanitize.jsx
import { toast } from 'sonner';

export const sanitizeInput = (input) => {
  // Handle null/undefined
  if (input == null) {
    return '';
  }

  // If input is a number, return it as is
  if (typeof input === 'number') {
    return input;
  }

  let sanitized = String(input);

  // 1) strip any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // 2) remove suspicious JS/data/vbscript patterns
  const suspiciousPatterns = [
    /javascript:/gi,
    /data:/gi,
    /vbscript:/gi,
    /onload=/gi,
    /onerror=/gi,
    /onclick=/gi,
    /onmouseover=/gi,
    /eval\(/gi,
    /expression\(/gi,
  ];
  suspiciousPatterns.forEach((rx) => {
    sanitized = sanitized.replace(rx, '');
  });

  // 3) Allow alphanumerics, spaces, dots, hyphens, and common symbols
  const whitelist = /[^0-9A-Za-z #@.,\-_/]/g;
  const cleaned = sanitized.replace(whitelist, '');

  // 4) if anything more than whitespace changed, notify user
  if (cleaned.trim() !== sanitized.trim()) {
    toast.error('Invalid characters were removed from input.');
  }

  return cleaned;
};

export const validateInput = (input) => {
  if (!input) return true; // empty is fine

  // Convert to string if number
  if (typeof input === 'number') {
    input = String(input);
  }

  // 1) fail on any of these dangerous substrings
  const dangerous = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /eval\(/i,
    /expression\(/i,
    /\(\)/g,  // literal "()"
    /\\/g,    // backslash
  ];
  if (dangerous.some((rx) => rx.test(input))) {
    return false;
  }

  // 2) explicitly reject null-byte or EOF control chars
  if (input.indexOf('\x00') !== -1 || input.indexOf('\x1a') !== -1) {
    return false;
  }

  return true;
};
