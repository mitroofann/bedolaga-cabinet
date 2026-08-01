import { Link } from 'react-router';

export function LandingLegalFooter() {
  return (
    <footer className="border-t border-dark-700/40 py-6">
      <nav
        className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-dark-400"
        aria-label="Документы"
      >
        <Link to="/info?tab=rules" className="hover:text-dark-200">
          Правила
        </Link>
        <Link to="/privacy" className="hover:text-dark-200">
          Политика конфиденциальности
        </Link>
        <Link to="/offer" className="hover:text-dark-200">
          Оферта
        </Link>
        <Link to="/recurrent-payments" className="hover:text-dark-200">
          Рекуррентные платежи
        </Link>
      </nav>
    </footer>
  );
}
