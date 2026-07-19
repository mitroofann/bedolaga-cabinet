import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { cn } from '../../lib/utils';

interface SanitizedHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'p' | 'span';
}

/** Renders admin-provided text (e.g. tariff descriptions, footers) as sanitized HTML. */
export function SanitizedHtml({ html, className, as: Tag = 'div' }: SanitizedHtmlProps) {
  const sanitized = useMemo(() => {
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'b', 'i', 'u', 'br', 'span', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    });
    // Enforce rel="noopener noreferrer" and target="_blank" on all links
    const container = document.createElement('div');
    container.innerHTML = clean;
    container.querySelectorAll('a').forEach((a) => {
      a.setAttribute('rel', 'noopener noreferrer');
      a.setAttribute('target', '_blank');
    });
    return container.innerHTML;
  }, [html]);

  return (
    <Tag
      className={cn('break-words', className)}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
