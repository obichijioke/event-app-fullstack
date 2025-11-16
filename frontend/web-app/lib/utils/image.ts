export function resolveImageUrl(src?: string | null): string | null {
  if (!src) return null;
  // Absolute URL
  if (/^https?:\/\//i.test(src)) return src;
  // Handle API-served uploads e.g., /uploads/...
  if (src.startsWith('/uploads')) {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${base}${src}`;
  }
  return src;
}

