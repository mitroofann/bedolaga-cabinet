import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { CheckIcon, ClipboardIcon } from '@/components/icons';
import { cn } from '../../lib/utils';
import { copyToClipboard } from '../../utils/clipboard';
import type { TrialFreeResponse } from '../../api/landings';

/**
 * Inline success UI for a free trial (mode:'free') when we did NOT auto-redirect
 * (no auto_login_token). Mirrors the display logic of PurchaseSuccess.tsx but is
 * self-contained (isolated feature — no import of that page's internals).
 */
export function TrialSuccessPanel({ result }: { result: TrialFreeResponse }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const displayUrl = result.subscription_url ?? result.subscription_crypto_link ?? null;
  const isTelegram = result.contact_type === 'telegram';

  const handleCopy = async (value: string) => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-success-500/30 bg-success-500/5 p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500/15">
          <CheckIcon className="h-4 w-4 text-success-500" />
        </span>
        <h3 className="text-base font-semibold text-dark-50">
          {t('landingTrial.successTitle', 'Your trial is ready')}
        </h3>
      </div>

      {/* Fresh email account credentials */}
      {result.cabinet_email && (
        <div className="space-y-2">
          <p className="text-sm text-dark-300">{t('landing.cabinetReady')}</p>
          <CopyableField
            label={t('landing.cabinetEmail')}
            value={result.cabinet_email}
            onCopy={handleCopy}
          />
          {result.cabinet_password && (
            <CopyableField
              label={t('landing.cabinetPassword')}
              value={result.cabinet_password}
              onCopy={handleCopy}
            />
          )}
          {result.cabinet_password && (
            <p className="text-xs text-dark-400">{t('landing.saveCredentials')}</p>
          )}
          <a
            href="/login"
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-400"
          >
            {t('landing.goToCabinet')}
          </a>
        </div>
      )}

      {/* Telegram arm: recipient not in bot → open-bot link */}
      {isTelegram && !result.cabinet_email && (
        <>
          <p className="text-sm text-dark-300">
            {result.recipient_in_bot === true
              ? t('landing.giftTelegramSent', 'Sent to your Telegram.')
              : t('landing.giftTelegramNotInBot', 'Open the bot to get access.')}
          </p>
          {result.recipient_in_bot !== true && result.bot_link && (
            <a
              href={result.bot_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-400"
            >
              {t('landing.openBot')}
            </a>
          )}
        </>
      )}

      {/* Subscription link + QR */}
      {displayUrl && (
        <div className="space-y-3">
          <div className="mx-auto w-fit rounded-2xl bg-white p-4">
            <QRCodeSVG value={displayUrl} size={180} level="M" includeMargin={false} />
          </div>
          <button
            type="button"
            onClick={() => handleCopy(displayUrl)}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              copied
                ? 'bg-success-500/10 text-success-500'
                : 'bg-dark-800/50 text-dark-200 hover:bg-dark-700/50',
            )}
          >
            {copied ? (
              <>
                <CheckIcon className="h-4 w-4" />
                {t('landing.copied', 'Copied!')}
              </>
            ) : (
              <>
                <ClipboardIcon className="h-4 w-4" />
                {t('landing.copyLink', 'Copy link')}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function CopyableField({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-dark-800/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-dark-400">{label}</p>
        <p className="truncate font-mono text-sm text-dark-100">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="shrink-0 rounded-lg bg-dark-700/60 p-2 text-dark-300 transition-colors hover:bg-dark-600/60"
        aria-label={label}
      >
        <ClipboardIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
