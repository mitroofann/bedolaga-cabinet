import { CheckIcon } from '@/components/icons';

interface LandingProgressStepsProps {
  current: 1 | 2 | 3 | 4;
}

const steps = [
  { title: 'Аккаунт', description: 'Войдите или создайте аккаунт' },
  { title: 'Доступ', description: 'Выберите пробный период или подписку' },
  { title: 'Оплата', description: 'Оплатите выбранный доступ' },
  { title: 'Подключение', description: 'Настройте VPN на устройстве' },
] as const;

export function LandingProgressSteps({ current }: LandingProgressStepsProps) {
  const activeStep = steps[current - 1];
  return (
    <nav aria-label="Шаги оформления" className="landing-progress">
      <div className="landing-progress__mobile-summary">
        <span className="text-xs font-semibold text-dark-100">Шаг {current} из 4</span>
        <span className="text-xs text-dark-400">{activeStep.title}</span>
      </div>
      <ol className="landing-progress__track">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < current;
          const active = stepNumber === current;
          return (
            <li
              key={step.title}
              aria-current={active ? 'step' : undefined}
              className="landing-progress__step"
            >
              <span
                className={`landing-progress__dot ${completed ? 'is-complete' : active ? 'is-active' : ''}`}
              >
                {completed ? <CheckIcon className="h-3.5 w-3.5" /> : stepNumber}
              </span>
              <span className={`landing-progress__label ${active ? 'is-active' : ''}`}>
                <span className="block text-xs font-semibold">{step.title}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-dark-400">
                  {step.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
