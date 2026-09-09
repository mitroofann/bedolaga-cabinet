import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePlatform } from '@/platform';

// Icons
import { SubscriptionIcon, WalletIcon, UsersIcon, ChatIcon, WheelIcon } from './icons';
// [Форк] Админские иконки — напрямую из централизованного набора, чтобы не
// расширять общий реэкспорт ./icons (меньше шансов на конфликт с апстримом).
import { ChartBarIcon, TicketIcon, ShieldIcon } from '@/components/icons';
import { useAuthStore } from '@/store/auth';

interface MobileBottomNavProps {
  isKeyboardOpen: boolean;
  /** Открыто выезжающее меню шапки: у него есть все те же пункты, панель поверх него лишняя. */
  isMenuOpen?: boolean;
  referralEnabled?: boolean;
  wheelEnabled?: boolean;
}

export function MobileBottomNav({
  isKeyboardOpen,
  isMenuOpen = false,
  referralEnabled,
  wheelEnabled,
}: MobileBottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { haptic } = usePlatform();
  // [Форк] Админам — своё нижнее меню (быстрый доступ в админку из любого места).
  const isAdmin = useAuthStore((state) => state.isAdmin);

  const isActive = (path: string) => {
    // [Форк] /admin (панель целиком) подсвечиваем только на нём самом — иначе
    // он подсвечивался бы вместе с /admin/tickets и /admin/sales-stats.
    if (path === '/admin') return location.pathname === '/admin';
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  // Core navigation items for bottom bar.
  //
  // Support is ALWAYS present — frustrated paying customers must find help
  // in the primary nav, not in the hamburger drawer. Previously Wheel
  // (a brand-moment surface) displaced Support (a critical-path surface)
  // when the wheel feature flag was on; that trade is hostile to the
  // support-user persona and was flagged by the /impeccable critique.
  //
  // Slot priority when both Wheel and Referral are enabled and only
  // four slots remain after Dashboard / Subscriptions / Balance / Support:
  //   - Wheel wins (operator opted in as a deliberate brand moment)
  //   - Referral falls back to the hamburger drawer
  // When only one of them is enabled, that one fills the slot.
  const coreItems = [
    // Custom fork: «Главная» hidden — `/` redirects to /subscriptions.
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    ...(wheelEnabled
      ? [{ path: '/wheel', label: t('nav.wheel'), icon: WheelIcon }]
      : referralEnabled
        ? [{ path: '/referral', label: t('nav.referral'), icon: UsersIcon }]
        : []),
    { path: '/support', label: t('nav.support'), icon: ChatIcon },
  ];

  // [Форк] Меню для админов: 5-й слот отдаётся под вход в админку.
  // Показывается везде, не только внутри /admin — быстрый переход с любой страницы.
  const adminItems = [
    { path: '/subscriptions', label: t('nav.subscription'), icon: SubscriptionIcon },
    { path: '/balance', label: t('nav.balance'), icon: WalletIcon },
    { path: '/admin/sales-stats', label: t('admin.nav.salesStats'), icon: ChartBarIcon },
    { path: '/admin/tickets', label: t('admin.nav.tickets'), icon: TicketIcon },
    { path: '/admin', label: t('admin.nav.title'), icon: ShieldIcon },
  ];

  const handleNavClick = () => {
    haptic.impact('light');
  };

  return (
    <nav
      className={cn(
        'fixed z-50 transition-all duration-200 lg:hidden',
        'bg-dark-900/95 backdrop-blur-linear',
        'border border-dark-700/30',
        isKeyboardOpen || isMenuOpen ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
      style={{
        // Отступ снизу и просвет под панелью объявлены в globals.css
        // (--mobile-nav-*): в standalone iOS inset около 34pt, и панель стоит
        // вплотную к безопасной зоне, в браузере — 16px.
        bottom: 'var(--mobile-nav-offset)',
        // По бокам та же логика: в альбомной ориентации iPhone вырезы слева и
        // справа около 59pt, панель не должна уходить под чёлку и углы.
        left: 'max(16px, env(safe-area-inset-left, 0px))',
        right: 'max(16px, env(safe-area-inset-right, 0px))',
        borderRadius: 'var(--bento-radius, 24px)',
        padding: '8px 4px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
      }}
    >
      <div className="flex justify-around">
        {(isAdmin ? adminItems : coreItems).map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(
              'relative flex min-w-[56px] flex-1 shrink-0 flex-col items-center justify-center rounded-2xl px-3 py-2.5 transition-all duration-200',
              isActive(item.path) ? 'text-accent-400' : 'text-dark-400 hover:text-dark-200',
            )}
          >
            {isActive(item.path) && (
              <motion.div
                layoutId="bottom-nav-active"
                className="absolute inset-0 rounded-2xl bg-accent-500/15"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <item.icon className="relative z-10 h-5 w-5" />
            <span className="relative z-10 mt-1 whitespace-nowrap text-2xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
