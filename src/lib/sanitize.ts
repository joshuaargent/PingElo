/**
 * Input sanitization utilities for preventing XSS and injection attacks
 */

// Characters that are dangerous in HTML/Script contexts
const DANGEROUS_CHARS_REGEX = /[<>'"&]/g;

// Character entities for safe HTML display
const HTML_ENTITIES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#x27;',
  '"': '&quot;',
  '&': '&amp;',
};

/**
 * Sanitizes a string to prevent XSS attacks
 * Removes dangerous HTML characters
 */
export function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(DANGEROUS_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char)
    .trim();
}

/**
 * Sanitizes a string for safe storage (removes dangerous chars without encoding)
 */
export function sanitizeForStorage(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Validates and sanitizes a username
 * - Max length: 50 characters
 * - Allowed: alphanumeric, spaces, underscores, hyphens, apostrophes
 */
export function sanitizeUsername(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .slice(0, 50) // Limit length
    .replace(/[^a-zA-Z0-9\s_\-']/g, "") // Keep only safe characters
    .trim();
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escapes HTML for safe display
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str.replace(DANGEROUS_CHARS_REGEX, (char) => HTML_ENTITIES[char] || char);
}
