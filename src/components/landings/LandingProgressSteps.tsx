import { CheckIcon } from '@/components/icons';

interface LandingProgressStepsProps {
  current: 1 | 2 | 3 | 4;
}

const steps = [
  { title: 'Продолжить', description: 'Войдите или создайте аккаунт' },
  { title: 'Выбрать доступ', description: 'Пробный период или подписка' },
  { title: 'Оплатить', description: 'Безопасная оплата выбранного доступа' },
  { title: 'Подключить устройство', description: 'Настройте VPN за пару минут' },
] as const;

export function LandingProgressSteps({ current }: LandingProgressStepsProps) {
  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Шаги оформления">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const completed = stepNumber < current;
        const active = stepNumber === current;
        return (
          <li
            key={step.title}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center gap-2 rounded-xl border p-3 ${
              active
                ? 'border-accent-500/60 bg-accent-500/10'
                : completed
                  ? 'border-success-500/30 bg-success-500/10'
                  : 'border-dark-700/50 bg-dark-900/40'
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                completed
                  ? 'bg-success-500 text-white'
                  : active
                    ? 'bg-accent-500 text-on-accent'
                    : 'bg-dark-800 text-dark-400'
              }`}
            >
              {completed ? <CheckIcon className="h-3.5 w-3.5" /> : stepNumber}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-dark-100">{step.title}</span>
              <span className="mt-0.5 block text-[10px] leading-tight text-dark-400">
                {step.description}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
