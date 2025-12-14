'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface EmailContentProps {
  html?: string[];
  text?: string;
  intro?: string;
}

/**
 * Sanitizes and renders email HTML content safely.
 *
 * Features:
 * - XSS protection via DOMPurify
 * - Style isolation to prevent CSS leakage
 * - Proper link handling (opens in new tab)
 * - Image constraints to prevent layout breaks
 * - Text selection enabled for copying
 * - Dark mode compatible
 */
export function EmailContent({ html, text, intro }: EmailContentProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html || html.length === 0) return null;

    const rawHtml = html.join('');

    // Configure DOMPurify
    const clean = DOMPurify.sanitize(rawHtml, {
      // Allow safe HTML elements
      ALLOWED_TAGS: [
        'a',
        'b',
        'i',
        'u',
        'em',
        'strong',
        'p',
        'br',
        'div',
        'span',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'dl',
        'dt',
        'dd',
        'table',
        'thead',
        'tbody',
        'tfoot',
        'tr',
        'th',
        'td',
        'img',
        'figure',
        'figcaption',
        'blockquote',
        'pre',
        'code',
        'hr',
        'sub',
        'sup',
        'small',
        'mark',
        'address',
        'article',
        'section',
        'header',
        'footer',
        'center',
        'font',
      ],
      // Allow safe attributes
      ALLOWED_ATTR: [
        'href',
        'src',
        'alt',
        'title',
        'width',
        'height',
        'style',
        'class',
        'id',
        'target',
        'rel',
        'colspan',
        'rowspan',
        'cellpadding',
        'cellspacing',
        'border',
        'align',
        'valign',
        'bgcolor',
        'color',
        'face',
        'size',
      ],
      // Allow data URIs for images
      ALLOW_DATA_ATTR: false,
      // Transform links to open in new tab
      ADD_ATTR: ['target', 'rel'],
    });

    // Post-process: add target="_blank" and rel="noopener" to all links
    const parser = new DOMParser();
    const doc = parser.parseFromString(clean, 'text/html');

    doc.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    // Add max-width to images to prevent overflow
    doc.querySelectorAll('img').forEach((img) => {
      const existingStyle = img.getAttribute('style') || '';
      img.setAttribute(
        'style',
        `${existingStyle}; max-width: 100%; height: auto;`
      );
    });

    return doc.body.innerHTML;
  }, [html]);

  // Render HTML content
  if (sanitizedHtml) {
    return (
      <div className="email-content-wrapper">
        <div
          className="email-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        <style jsx>{`
          .email-content-wrapper {
            /* Enable text selection for copying */
            user-select: text;
            -webkit-user-select: text;

            /* Contain styles from email */
            contain: content;

            /* Base typography */
            font-size: 14px;
            line-height: 1.6;
          }

          .email-content {
            /* Reset some inherited styles */
            all: initial;
            display: block;
            font-family: inherit;
            font-size: inherit;
            line-height: inherit;
            color: inherit;

            /* Word wrapping */
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          /* Links */
          .email-content :global(a) {
            color: hsl(var(--primary));
            text-decoration: underline;
            text-underline-offset: 2px;
          }

          .email-content :global(a:hover) {
            opacity: 0.8;
          }

          /* Images */
          .email-content :global(img) {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }

          /* Tables (common in email) */
          .email-content :global(table) {
            border-collapse: collapse;
            max-width: 100%;
            overflow-x: auto;
            display: block;
          }

          .email-content :global(td),
          .email-content :global(th) {
            padding: 8px;
            border: 1px solid hsl(var(--border));
          }

          /* Paragraphs */
          .email-content :global(p) {
            margin: 0 0 1em 0;
          }

          /* Headings */
          .email-content :global(h1),
          .email-content :global(h2),
          .email-content :global(h3),
          .email-content :global(h4),
          .email-content :global(h5),
          .email-content :global(h6) {
            margin: 1em 0 0.5em 0;
            font-weight: 600;
            line-height: 1.3;
          }

          /* Lists */
          .email-content :global(ul),
          .email-content :global(ol) {
            margin: 0 0 1em 0;
            padding-left: 1.5em;
          }

          .email-content :global(li) {
            margin-bottom: 0.25em;
          }

          /* Blockquotes */
          .email-content :global(blockquote) {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 3px solid hsl(var(--border));
            color: hsl(var(--muted-foreground));
          }

          /* Code blocks */
          .email-content :global(pre) {
            background: hsl(var(--muted));
            padding: 1em;
            border-radius: 6px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 0.9em;
          }

          .email-content :global(code) {
            background: hsl(var(--muted));
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9em;
          }

          /* Horizontal rule */
          .email-content :global(hr) {
            border: none;
            border-top: 1px solid hsl(var(--border));
            margin: 1.5em 0;
          }

          /* Override potential background colors in dark mode */
          @media (prefers-color-scheme: dark) {
            .email-content :global([style*='background']),
            .email-content :global([bgcolor]) {
              background: transparent !important;
              background-color: transparent !important;
            }

            .email-content :global([style*='color: #000']),
            .email-content :global([style*='color:#000']),
            .email-content :global([style*='color: black']),
            .email-content :global([color='black']),
            .email-content :global([color='#000']) {
              color: inherit !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Render plain text content
  const textContent = text || intro;
  if (textContent) {
    return (
      <div className="email-text-content select-text">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
          {textContent}
        </pre>
      </div>
    );
  }

  // No content
  return (
    <p className="text-muted-foreground italic text-sm">No message content</p>
  );
}
