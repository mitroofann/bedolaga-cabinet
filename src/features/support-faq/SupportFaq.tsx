import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PiCaretDown } from 'react-icons/pi';
import { Card } from '@/components/data-display/Card';
import { infoApi } from '@/api/info';
import { infoPagesApi, type FaqItem } from '@/api/infoPages';
import { formatContent } from '@/utils/legalContent';
import DOMPurify from 'dompurify';

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'player.vimeo.com',
  'www.youtube-nocookie.com',
]);

const richFaqPurify = DOMPurify(window);

richFaqPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    const src = node.getAttribute('src') ?? '';
    try {
      const url = new URL(src);
      if (url.protocol !== 'https:' || !ALLOWED_IFRAME_HOSTS.has(url.hostname)) {
        node.remove();
        return;
      }
    } catch {
      node.remove();
      return;
    }
    node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    node.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
  }
  if (node.tagName === 'VIDEO') {
    const src = node.getAttribute('src') ?? '';
    try {
      const url = new URL(src);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        node.remove();
        return;
      }
    } catch {
      node.remove();
      return;
    }
    node.setAttribute('controls', '');
    node.setAttribute('preload', 'metadata');
  }
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
  if (node.hasAttribute('style')) {
    const style = node.getAttribute('style') ?? '';
    const match = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
    if (match) {
      node.setAttribute('style', `text-align: ${match[1]}`);
    } else {
      node.removeAttribute('style');
    }
  }
});

const RICH_FAQ_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'div',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'pre',
    'code',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'ins',
    'span',
    'mark',
    'sub',
    'sup',
    'small',
    'img',
    'video',
    'iframe',
    'figure',
    'figcaption',
  ],
  ALLOWED_ATTR: [
    'href',
    'target',
    'rel',
    'src',
    'alt',
    'title',
    'width',
    'height',
    'loading',
    'class',
    'start',
    'reversed',
    'type',
    'controls',
    'preload',
    'frameborder',
    'allowfullscreen',
    'allow',
    'sandbox',
    'style',
  ],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
};

const sanitizeRichFaqHtml = (html: string): string =>
  richFaqPurify.sanitize(html, RICH_FAQ_SANITIZE_CONFIG);

const parseFaqItems = (raw: unknown): FaqItem[] => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is FaqItem =>
        !!item &&
        typeof item === 'object' &&
        typeof item.q === 'string' &&
        typeof item.a === 'string',
    );
  } catch {
    return [];
  }
};

export function SupportFaq() {
  const { t, i18n } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const locale = i18n.language.split('-')[0];

  const {
    data: replacements,
    isLoading: replacementsLoading,
    isError: replacementsError,
  } = useQuery({
    queryKey: ['info-pages', 'tab-replacements'],
    queryFn: infoPagesApi.getTabReplacements,
    staleTime: 60_000,
  });
  const { data: visibility, isLoading: visibilityLoading } = useQuery({
    queryKey: ['info-visibility'],
    queryFn: infoApi.getVisibility,
    staleTime: 60_000,
  });

  const replacementSlug = replacements?.faq ?? null;
  const {
    data: replacementPage,
    isLoading: replacementLoading,
    isError: replacementPageError,
  } = useQuery({
    queryKey: ['info-pages', 'page', replacementSlug],
    queryFn: () => {
      if (!replacementSlug) throw new Error('Missing FAQ replacement slug');
      return infoPagesApi.getPageBySlug(replacementSlug);
    },
    enabled: !!replacementSlug,
    staleTime: 60_000,
  });
  const {
    data: legacyFaq,
    isLoading: legacyLoading,
    isError: legacyError,
  } = useQuery({
    queryKey: ['faq-pages'],
    queryFn: infoApi.getFaqPages,
    enabled: !replacementsLoading && !replacementsError && !replacementSlug,
    staleTime: 60_000,
  });

  const items = useMemo(() => {
    if (replacementSlug) {
      if (replacementPage?.page_type !== 'faq') return [];
      const raw =
        replacementPage.content[locale] ||
        replacementPage.content.ru ||
        replacementPage.content.en ||
        '[]';
      return parseFaqItems(raw).map((item, index) => ({ ...item, key: `custom-${index}` }));
    }
    return [...(legacyFaq ?? [])]
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .map((item) => ({ q: item.title, a: item.content, key: `legacy-${item.id}` }));
  }, [legacyFaq, locale, replacementPage, replacementSlug]);

  const loading =
    replacementsLoading ||
    visibilityLoading ||
    (replacementSlug ? replacementLoading : legacyLoading);
  const error = replacementsError || replacementPageError || legacyError;
  if (
    loading ||
    error ||
    (!replacementSlug && visibility?.faq === false) ||
    (replacementSlug && !replacementPage) ||
    (!replacementSlug && !legacyFaq) ||
    items.length === 0
  ) {
    return null;
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-dark-100">{t('support.faqTitle')}</h2>
        <p className="mt-1 text-sm text-dark-400">{t('support.faqDescription')}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const isOpen = openId === item.key;
          const panelId = `support-faq-panel-${item.key}`;
          const buttonId = `support-faq-button-${item.key}`;
          const html = replacementSlug ? sanitizeRichFaqHtml(item.a) : formatContent(item.a);
          return (
            <div
              key={item.key}
              className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800/50"
            >
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenId((current) => (current === item.key ? null : item.key))}
                className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-dark-800 focus:outline-none focus:ring-2 focus:ring-accent-500/60"
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className="font-medium text-dark-100">{item.q}</span>
                <PiCaretDown
                  className={`h-5 w-5 shrink-0 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="border-t border-dark-700/50 px-4 pb-4 pt-3"
                >
                  <div
                    className="prose prose-invert max-w-none text-sm text-dark-300"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: FAQ HTML is sanitized by formatContent or sanitizeRichFaqHtml.
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
