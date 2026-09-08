import type { ReactNode } from 'react';

/**
 * [Форк] Безопасный рендерер Telegram-HTML для превью сообщений маркетинговых
 * ботов. Бэкенд шлёт текст с parse_mode='HTML', поэтому превью обязано показывать
 * те же теги, которые отрендерит Telegram — не больше и не меньше.
 *
 * Разрешены только теги, которые поддерживает Telegram HTML: b/strong, i/em,
 * u, s/strike/del, code, pre, a[href]. Всё остальное (включая незакрытые и
 * посторонние теги вида <script>) остаётся обычным текстом — XSS невозможен,
 * потому что React экранирует текст, а createElement вызываем только мы
 * для фиксированного набора тегов.
 */

const TELEGRAM_HTML_TAGS = new Set([
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'strike',
  'del',
  'code',
  'pre',
  'a',
]);

/** Telegram рисует ссылки голубым; берём цвет прямо из его тёмной темы. */
const LINK_CLASS = 'text-[#6ab3f3] underline underline-offset-2';
const CODE_CLASS =
  'rounded bg-white/10 px-1 py-0.5 font-mono text-[0.9em] [font-family:var(--font-mono,monospace)]';
const PRE_CLASS =
  'my-1 block overflow-x-auto rounded bg-white/10 p-2 font-mono text-[0.9em] [font-family:var(--font-mono,monospace)]';

interface Frame {
  tag: string;
  href?: string;
  children: ReactNode[];
}

function unescapeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, '&');
}

/** href только с безопасной схемой; всё прочее → ссылка без href (просто текст). */
function extractHref(tagToken: string): string | undefined {
  const m = tagToken.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const raw = m?.[1] ?? m?.[2] ?? m?.[3];
  if (!raw) return undefined;
  try {
    const url = new URL(raw, 'https://t.me');
    if (url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'tg:') {
      return raw;
    }
  } catch {
    // malformed URL → render as plain styled text
  }
  return undefined;
}

/**
 * Разбор «наивный», но достаточный для админского ввода: токены по `/<[^>]+>/`,
 * вложенность через стек. Незакрытые теги в конце просто закрываются, лишние
 * закрывающие игнорируются — Telegram ведёт себя так же (не рендерит и не падает).
 */
export function renderTelegramHtml(source: string): ReactNode {
  const tokens = source.split(/(<[^>]*>)/g);
  const root: Frame = { tag: 'root', children: [] };
  const stack: Frame[] = [root];

  const buildElement = (frame: Frame, key: string): ReactNode => {
    switch (frame.tag) {
      case 'b':
      case 'strong':
        return <strong key={key}>{frame.children}</strong>;
      case 'i':
      case 'em':
        return <em key={key}>{frame.children}</em>;
      case 'u':
        return <u key={key}>{frame.children}</u>;
      case 's':
      case 'strike':
      case 'del':
        return <s key={key}>{frame.children}</s>;
      case 'code':
        return (
          <code key={key} className={CODE_CLASS}>
            {frame.children}
          </code>
        );
      case 'pre':
        return (
          <pre key={key} className={PRE_CLASS}>
            {frame.children}
          </pre>
        );
      case 'a':
        return frame.href ? (
          <a
            key={key}
            href={frame.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
          >
            {frame.children}
          </a>
        ) : (
          <span key={key} className={LINK_CLASS}>
            {frame.children}
          </span>
        );
      default:
        return <span key={key}>{frame.children}</span>;
    }
  };

  tokens.forEach((token, i) => {
    if (!token) return;
    if (!token.startsWith('<')) {
      stack[stack.length - 1].children.push(unescapeEntities(token));
      return;
    }

    const tagName = token.match(/^<\/?\s*([a-zA-Z][a-zA-Z0-9]*)/)?.[1]?.toLowerCase();
    if (!tagName || !TELEGRAM_HTML_TAGS.has(tagName)) return; // посторонний тег — обычный текст

    if (token.startsWith('</')) {
      // Ищем ближайший открытый такой же тег и закрываем всё, что выше него.
      let idx = -1;
      for (let k = stack.length - 1; k >= 1; k--) {
        if (stack[k].tag === tagName) {
          idx = k;
          break;
        }
      }
      if (idx > 0) {
        while (stack.length > idx) {
          const frame = stack.pop() as Frame;
          const parent = stack[stack.length - 1];
          parent.children.push(buildElement(frame, `${tagName}-${i}-${frame.tag}`));
        }
      }
      return;
    }

    if (token.endsWith('/>')) return; // самозакрывающихся тегов в Telegram HTML нет
    stack.push({
      tag: tagName,
      href: tagName === 'a' ? extractHref(token) : undefined,
      children: [],
    });
  });

  while (stack.length > 1) {
    const frame = stack.pop() as Frame;
    stack[stack.length - 1].children.push(buildElement(frame, `tail-${frame.tag}`));
  }

  return root.children;
}

export function TelegramHtml({ text }: { text: string }) {
  return <>{renderTelegramHtml(text)}</>;
}
