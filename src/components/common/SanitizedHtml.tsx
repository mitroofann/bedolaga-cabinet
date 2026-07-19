import DOMPurify from 'dompurify';

interface SanitizedHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'p' | 'span';
}

/** Renders admin-provided text (e.g. tariff descriptions) as sanitized HTML. */
export function SanitizedHtml({ html, className, as: Tag = 'div' }: SanitizedHtmlProps) {
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}
