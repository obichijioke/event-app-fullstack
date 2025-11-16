/**
 * Social sharing utility functions
 */

interface ShareData {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string; // Twitter handle
}

/**
 * Generate Facebook share URL
 */
export function generateFacebookShareURL(data: ShareData): string {
  const params = new URLSearchParams({
    u: data.url,
  });

  if (data.title) {
    params.append('quote', data.title);
  }

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
}

/**
 * Generate Twitter/X share URL
 */
export function generateTwitterShareURL(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
    text: data.title,
  });

  if (data.via) {
    params.append('via', data.via);
  }

  if (data.hashtags && data.hashtags.length > 0) {
    params.append('hashtags', data.hashtags.join(','));
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate LinkedIn share URL
 */
export function generateLinkedInShareURL(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
  });

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate WhatsApp share URL
 */
export function generateWhatsAppShareURL(data: ShareData): string {
  const text = data.description 
    ? `${data.title}\n\n${data.description}\n\n${data.url}`
    : `${data.title}\n\n${data.url}`;

  const params = new URLSearchParams({
    text: text,
  });

  return `https://wa.me/?${params.toString()}`;
}

/**
 * Generate Telegram share URL
 */
export function generateTelegramShareURL(data: ShareData): string {
  const params = new URLSearchParams({
    url: data.url,
    text: data.title,
  });

  return `https://t.me/share/url?${params.toString()}`;
}

/**
 * Generate email share URL
 */
export function generateEmailShareURL(data: ShareData): string {
  const subject = data.title;
  const body = data.description 
    ? `${data.description}\n\n${data.url}`
    : data.url;

  const params = new URLSearchParams({
    subject: subject,
    body: body,
  });

  return `mailto:?${params.toString()}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Use native Web Share API if available
 */
export async function nativeShare(data: ShareData): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.description,
        url: data.url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      console.error('Native share failed:', err);
      return false;
    }
  }
  return false;
}

/**
 * Check if native share is available
 */
export function isNativeShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}

