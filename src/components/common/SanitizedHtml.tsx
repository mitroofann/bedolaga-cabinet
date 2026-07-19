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
      className={cn(
        // Tailwind's preflight strips default list/paragraph styling — restore it
        // so admin-authored markup actually looks formatted.
        'break-words [&_a]:underline [&_li]:mt-1 [&_ol]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:text-left [&_p]:mt-1.5 [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-left',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
