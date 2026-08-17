'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { attachmentProxyUrl } from '@/lib/api/tf-api';

interface EmailContentProps {
 body?: string;
 bodyContentType?: string;
 email?: string;
 messageId?: string;
 inlineCids?: Record<string, string>;
}

/**
 * Renders temp.tf email body safely.
 * - HTML: cid: sources rewritten to /api/tf/attachment proxy URLs, DOMPurify sanitized
 * - Text: `[image: N]` tokens replaced with inline proxy images
 */
export function EmailContent({
 body,
 bodyContentType,
 email,
 messageId,
 inlineCids,
}: EmailContentProps) {
 const isHtml = bodyContentType === 'html';

 const sanitizedHtml = useMemo(() => {
  if (!body || !isHtml) return null;

  let rawHtml = body;
  // Rewrite cid: image sources to proxy URLs
  if (email && messageId && inlineCids && Object.keys(inlineCids).length > 0) {
   rawHtml = rawHtml.replace(
    /src=["']cid:([^"'>\s]+)["']/gi,
    (_match, cid: string) => {
     const cleaned = cid.trim().replace(/^<|>$/g, '');
     const attachmentId = inlineCids[cleaned];
     if (!attachmentId) {
      return 'src="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'/%3E"';
     }
     return `src="${attachmentProxyUrl(email, messageId, attachmentId)}"`;
    }
   );
  }

  const clean = DOMPurify.sanitize(rawHtml, {
   ALLOWED_TAGS: [
    'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl', 'dt',
    'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'img',
    'figure', 'figcaption', 'blockquote', 'pre', 'code', 'hr', 'sub',
    'sup', 'small', 'mark', 'address', 'article', 'section', 'header',
    'footer', 'center', 'font',
   ],
   ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'width', 'height', 'style', 'class',
    'id', 'target', 'rel', 'colspan', 'rowspan', 'cellpadding',
    'cellspacing', 'border', 'align', 'valign', 'bgcolor', 'color',
    'face', 'size',
   ],
   ALLOW_DATA_ATTR: false,
   ADD_ATTR: ['target', 'rel'],
  });

  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, 'text/html');
  doc.querySelectorAll('a').forEach((link) => {
   link.setAttribute('target', '_blank');
   link.setAttribute('rel', 'noopener noreferrer');
  });
  doc.querySelectorAll('img').forEach((img) => {
   img.style.maxWidth = '100%';
   img.style.height = 'auto';
  });
  return doc.body.innerHTML;
 }, [body, isHtml, email, messageId, inlineCids]);

 const textContent = useMemo(() => {
  if (!body || isHtml) return null;
  if (
   !email ||
   !messageId ||
   !inlineCids ||
   Object.keys(inlineCids).length === 0
  ) {
   return body;
  }
  const attachmentIds = Object.values(inlineCids);
  let index = 0;
  return body
   .replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/\n/g, '<br>\n')
   .replace(/\[image:\s*([^\]]+)\]/gi, () => {
    const attachmentId = attachmentIds[index++];
    if (!attachmentId) return '';
    return `<img src="${attachmentProxyUrl(email, messageId, attachmentId)}" alt="inline" style="max-width:100%;height:auto;" />`;
   });
 }, [body, isHtml, email, messageId, inlineCids]);

 if (sanitizedHtml) {
  return (
   <div
    className="email-body break-words max-w-full overflow-auto [&_img]:max-w-full [&_img]:h-auto"
    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
   />
  );
 }

 if (textContent) {
  return (
   <div
    className="whitespace-pre-wrap break-words max-w-full [&_img]:max-w-full [&_img]:h-auto"
    dangerouslySetInnerHTML={{ __html: textContent }}
   />
  );
 }

 return <p className="text-muted-foreground italic text-sm">(No content)</p>;
}
