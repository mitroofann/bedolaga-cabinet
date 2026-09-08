import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { marketingBotsApi, type MarketingBot } from '../api/marketingBots';
import { getApiErrorMessage } from '../utils/api-error';
import { usePlatform } from '../platform/hooks/usePlatform';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { BotIcon, BackIcon, EditIcon, TrashIcon, PlusIcon } from '../components/icons';
import { Skeleton, SkeletonGroup } from '../components/ui/skeleton';
import { TelegramHtml } from '../components/marketing/TelegramHtml';
import { useToast } from '../components/Toast';

const localeMap: Record<string, string> = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN', fa: 'fa-IR' };

/** Маска токена: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` → `123456789:ABC***xyz`. */
export function maskBotToken(token: string): string {
  const colon = token.indexOf(':');
  if (colon === -1 || token.length < colon + 8) return '***';
  const head = token.slice(0, colon + 4);
  const tail = token.slice(-3);
  return `${head}***${tail}`;
}

export default function AdminMarketingBots() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { capabilities } = usePlatform();
  const { showToast } = useToast();

  const [editing, setEditing] = useState<MarketingBot | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<MarketingBot | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const deleteDialogRef = useFocusTrap<HTMLDivElement>(deleteConfirm !== null, {
    onEscape: () => setDeleteConfirm(null),
  });

  const { data: bots, isLoading } = useQuery({
    queryKey: ['admin-marketing-bots'],
    queryFn: marketingBotsApi.getBots,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => marketingBotsApi.deleteBot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-bots'] });
      setDeleteConfirm(null);
      showToast({
        type: 'success',
        title: t('admin.marketingBots.delete.success'),
        message: '',
      });
    },
    onError: (err) => {
      setDeleteConfirm(null);
      showToast({
        type: 'error',
        title: t('admin.marketingBots.delete.failed'),
        message: getApiErrorMessage(err, ''),
      });
    },
    onSettled: () => setDeletingId(null),
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (bot: MarketingBot) => {
    setEditing(bot);
    setModalOpen(true);
  };

  const locale = localeMap[i18n.language] || 'ru-RU';
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(locale);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {!capabilities.hasBackButton && (
            <button
              onClick={() => navigate('/admin')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-700 bg-dark-800 transition-colors hover:border-dark-600"
            >
              <BackIcon />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-dark-100">
              {t('admin.marketingBots.title')}
            </h1>
            <p className="text-sm text-dark-400">{t('admin.marketingBots.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-on-accent transition-colors hover:bg-accent-600"
        >
          <PlusIcon />
          {t('admin.marketingBots.createButton')}
        </button>
      </div>

      {/* Bots list */}
      {isLoading ? (
        <SkeletonGroup className="space-y-3">
          <Skeleton variant="card" count={3} className="h-16" />
        </SkeletonGroup>
      ) : !bots || bots.length === 0 ? (
        <div className="py-12 text-center">
          <BotIcon className="mx-auto mb-3 h-12 w-12 text-dark-600" />
          <p className="text-dark-400">{t('admin.marketingBots.noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className={`rounded-xl border bg-dark-800 p-4 transition-colors ${
                bot.is_active ? 'border-dark-700' : 'border-dark-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-medium text-dark-100">{bot.name}</h3>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        bot.is_active
                          ? 'bg-success-500/20 text-success-400'
                          : 'bg-dark-600 text-dark-400'
                      }`}
                    >
                      {bot.is_active
                        ? t('admin.marketingBots.status.active')
                        : t('admin.marketingBots.status.inactive')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-dark-400">
                    <span className="font-mono text-xs">{maskBotToken(bot.bot_token)}</span>
                    {bot.button_text && bot.button_url ? (
                      <span className="truncate text-xs text-accent-400">
                        {t('admin.marketingBots.table.button')}: {bot.button_text}
                      </span>
                    ) : (
                      <span className="text-xs text-dark-600">
                        {t('admin.marketingBots.table.noButton')}
                      </span>
                    )}
                    <span className="text-xs">
                      {t('admin.marketingBots.table.created', { date: formatDate(bot.created_at) })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => openEdit(bot)}
                    className="rounded-lg bg-dark-700 p-2 text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
                    title={t('admin.marketingBots.table.edit')}
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingId(bot.id);
                      setDeleteConfirm(bot);
                    }}
                    disabled={deleteMutation.isPending && deletingId === bot.id}
                    className="rounded-lg bg-dark-700 p-2 text-dark-300 transition-colors hover:bg-error-500/20 hover:text-error-400"
                    title={t('admin.marketingBots.table.delete')}
                  >
                    {deleteMutation.isPending && deletingId === bot.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-dark-500 border-t-error-400" />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-dark-950/60"
            onClick={() => setDeleteConfirm(null)}
            aria-hidden="true"
          />
          <div
            ref={deleteDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketing-bot-delete-title"
            tabIndex={-1}
            className="relative w-full max-w-sm rounded-xl bg-dark-800 p-6"
          >
            <h3
              id="marketing-bot-delete-title"
              className="mb-2 text-lg font-semibold text-dark-100"
            >
              {t('admin.marketingBots.confirm.deleteTitle')}
            </h3>
            <p className="mb-6 text-dark-400">
              {t('admin.marketingBots.confirm.deleteText', { name: deleteConfirm.name })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-dark-300 transition-colors hover:text-dark-100"
              >
                {t('admin.marketingBots.confirm.cancel')}
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                className="rounded-lg bg-error-500 px-4 py-2 text-white transition-colors hover:bg-error-600"
              >
                {t('admin.marketingBots.confirm.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && <MarketingBotModal bot={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ============ Modal ============

const TELEGRAM_TOKEN_RE = /^\d+:[A-Za-z0-9_-]{35}$/;

interface MarketingBotModalProps {
  bot: MarketingBot | null;
  onClose: () => void;
}

function MarketingBotModal({ bot, onClose }: MarketingBotModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEdit = bot !== null;

  const [name, setName] = useState(bot?.name ?? '');
  const [botToken, setBotToken] = useState(bot?.bot_token ?? '');
  const [imageUrl, setImageUrl] = useState(bot?.image_url ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(bot?.welcome_message ?? '');
  const [buttonText, setButtonText] = useState(bot?.button_text ?? '');
  const [buttonUrl, setButtonUrl] = useState(bot?.button_url ?? '');
  const [isActive, setIsActive] = useState(bot?.is_active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFormatHelp, setShowFormatHelp] = useState(false);
  const modalRef = useFocusTrap<HTMLDivElement>(true, { onEscape: onClose });

  const isValidHttpUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('admin.marketingBots.validation.nameRequired');
    else if (name.trim().length > 255) next.name = t('admin.marketingBots.validation.nameTooLong');
    if (!botToken.trim()) next.botToken = t('admin.marketingBots.validation.tokenRequired');
    else if (!TELEGRAM_TOKEN_RE.test(botToken.trim()))
      next.botToken = t('admin.marketingBots.validation.tokenInvalid');
    if (!welcomeMessage.trim())
      next.welcomeMessage = t('admin.marketingBots.validation.messageRequired');
    if (imageUrl.trim() && !isValidHttpUrl(imageUrl.trim()))
      next.imageUrl = t('admin.marketingBots.validation.invalidUrl');
    // Кнопка — только в паре: одно поле заполнено, другое нет → ошибка.
    const hasText = buttonText.trim().length > 0;
    const hasUrl = buttonUrl.trim().length > 0;
    if (hasText !== hasUrl) {
      if (!hasText) next.buttonText = t('admin.marketingBots.validation.buttonPair');
      if (!hasUrl) next.buttonUrl = t('admin.marketingBots.validation.buttonPair');
    } else if (hasUrl && !isValidHttpUrl(buttonUrl.trim())) {
      next.buttonUrl = t('admin.marketingBots.validation.invalidUrl');
    }
    if (hasText && buttonText.trim().length > 64)
      next.buttonText = t('admin.marketingBots.validation.buttonTextTooLong');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const hasText = buttonText.trim().length > 0;
      const hasUrl = buttonUrl.trim().length > 0;
      const pair = hasText && hasUrl;
      const payload = {
        name: name.trim(),
        bot_token: botToken.trim(),
        welcome_message: welcomeMessage,
        image_url: imageUrl.trim() || null,
        button_text: pair ? buttonText.trim() : null,
        button_url: pair ? buttonUrl.trim() : null,
      };
      return isEdit
        ? marketingBotsApi.updateBot(bot.id, { ...payload, is_active: isActive })
        : marketingBotsApi.createBot(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-marketing-bots'] });
      showToast({
        type: 'success',
        title: isEdit
          ? t('admin.marketingBots.save.successEdit')
          : t('admin.marketingBots.save.successCreate'),
        message: '',
      });
      onClose();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: isEdit
          ? t('admin.marketingBots.save.failedEdit')
          : t('admin.marketingBots.save.failedCreate'),
        message: getApiErrorMessage(err, ''),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    saveMutation.mutate();
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border bg-dark-800 px-4 py-2.5 text-sm text-dark-100 transition-colors placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 ${
      errors[field] ? 'border-error-500' : 'border-dark-700 focus:border-accent-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-dark-950/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketing-bot-modal-title"
        tabIndex={-1}
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-dark-900 shadow-xl"
      >
        <div className="border-b border-dark-800 px-6 py-4">
          <h2 id="marketing-bot-modal-title" className="text-lg font-semibold text-dark-100">
            {isEdit
              ? t('admin.marketingBots.modal.editTitle')
              : t('admin.marketingBots.modal.createTitle')}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.name')} <span className="text-error-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('admin.marketingBots.fields.namePlaceholder')}
                className={inputClass('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-error-400">{errors.name}</p>}
            </div>

            {/* Bot token */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.token')} <span className="text-error-400">*</span>
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className={`${inputClass('botToken')} font-mono`}
              />
              <p className="mt-1 text-xs text-dark-500">
                {t('admin.marketingBots.fields.tokenHint')}
              </p>
              {errors.botToken && <p className="mt-1 text-xs text-error-400">{errors.botToken}</p>}
            </div>

            {/* Image URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.imageUrl')}
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={inputClass('imageUrl')}
              />
              <p className="mt-1 text-xs text-dark-500">
                {t('admin.marketingBots.fields.imageUrlHint')}
              </p>
              {errors.imageUrl && <p className="mt-1 text-xs text-error-400">{errors.imageUrl}</p>}
            </div>

            {/* Welcome message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.welcomeMessage')}{' '}
                <span className="text-error-400">*</span>
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder={t('admin.marketingBots.fields.welcomeMessagePlaceholder')}
                rows={5}
                className={`${inputClass('welcomeMessage')} resize-y`}
              />
              {errors.welcomeMessage && (
                <p className="mt-1 text-xs text-error-400">{errors.welcomeMessage}</p>
              )}

              {/* Formatting help */}
              <button
                type="button"
                onClick={() => setShowFormatHelp((v) => !v)}
                className="mt-1.5 text-xs text-accent-400 hover:text-accent-300"
              >
                {showFormatHelp
                  ? t('admin.marketingBots.format.hideHelp')
                  : t('admin.marketingBots.format.showHelp')}
              </button>
              {showFormatHelp && (
                <div className="mt-2 rounded-xl border border-dark-700 bg-dark-800/60 p-3 text-xs text-dark-400">
                  <p className="mb-1 font-medium text-dark-300">
                    {t('admin.marketingBots.format.title')}
                  </p>
                  <ul className="space-y-0.5 font-mono">
                    <li>&lt;b&gt;жирный&lt;/b&gt; / &lt;strong&gt;жирный&lt;/strong&gt;</li>
                    <li>&lt;i&gt;курсив&lt;/i&gt; / &lt;em&gt;курсив&lt;/em&gt;</li>
                    <li>&lt;code&gt;моноширинный&lt;/code&gt;</li>
                    <li>&lt;a href="URL"&gt;ссылка&lt;/a&gt;</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Button text */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.buttonText')}
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder={t('admin.marketingBots.fields.buttonTextPlaceholder')}
                className={inputClass('buttonText')}
              />
              <p className="mt-1 text-xs text-dark-500">
                {t('admin.marketingBots.fields.buttonTextHint')}
              </p>
              {errors.buttonText && (
                <p className="mt-1 text-xs text-error-400">{errors.buttonText}</p>
              )}
            </div>

            {/* Button URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                {t('admin.marketingBots.fields.buttonUrl')}
              </label>
              <input
                type="text"
                value={buttonUrl}
                onChange={(e) => setButtonUrl(e.target.value)}
                placeholder="https://t.me/your_main_bot"
                className={inputClass('buttonUrl')}
              />
              <p className="mt-1 text-xs text-dark-500">
                {t('admin.marketingBots.fields.buttonUrlHint')}
              </p>
              {errors.buttonUrl && (
                <p className="mt-1 text-xs text-error-400">{errors.buttonUrl}</p>
              )}
            </div>

            {/* Telegram-style live preview */}
            {(welcomeMessage.trim() ||
              imageUrl.trim() ||
              (buttonText.trim() && buttonUrl.trim())) && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-dark-500">
                  {t('admin.marketingBots.preview.label')}
                </p>
                <div className="rounded-xl bg-[#212121] p-3">
                  {imageUrl.trim() && (
                    <img
                      src={imageUrl.trim()}
                      alt=""
                      className="mb-2 max-h-40 w-full rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="mb-2 max-w-[85%] rounded-xl rounded-tl-sm bg-[#2b2b2b] px-3 py-2">
                    <p className="whitespace-pre-wrap break-words text-sm text-[#e9eaeb]">
                      {/* [Форк] Рендерим Telegram-HTML так, как его отрисует сам
                          Telegram (parse_mode='HTML' на бэкенде). */}
                      {welcomeMessage.trim() ? (
                        <TelegramHtml text={welcomeMessage} />
                      ) : (
                        t('admin.marketingBots.preview.fallbackMessage')
                      )}
                    </p>
                  </div>
                  {buttonText.trim() && buttonUrl.trim() && (
                    <div className="max-w-[85%] rounded-xl bg-[#2b2b2b] p-2">
                      <div className="rounded-lg bg-[#2b5278] py-2 text-center text-sm font-medium text-white">
                        {buttonText.trim()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active toggle (edit only) */}
            {isEdit && (
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dark-700 bg-dark-800 px-4 py-3">
                <span className="text-sm font-medium text-dark-300">
                  {t('admin.marketingBots.fields.isActive')}
                </span>
                <span
                  role="switch"
                  aria-checked={isActive}
                  tabIndex={0}
                  onClick={() => setIsActive((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setIsActive((v) => !v);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    isActive ? 'bg-success-500' : 'bg-dark-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </label>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-dark-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-300 transition-colors hover:text-dark-100"
            >
              {t('admin.marketingBots.modal.cancel')}
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-accent-500 px-4 py-2 text-on-accent transition-colors hover:bg-accent-600 disabled:opacity-50"
            >
              {saveMutation.isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isEdit ? t('admin.marketingBots.modal.save') : t('admin.marketingBots.modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
