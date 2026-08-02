import { CheckIcon } from '@/components/icons';

interface LandingProgressStepsProps {
  current: 1 | 2 | 3 | 4;
}

const steps = [
  { title: 'Аккаунт', description: 'Войдите или создайте аккаунт для управления VPN' },
  { title: 'Доступ', description: 'Выберите пробный доступ или подписку' },
  { title: 'Оплата', description: 'Подтвердите оплату у выбранного провайдера' },
  { title: 'Подключение', description: 'Получите инструкцию и подключите устройство' },
] as const;

export function LandingProgressSteps({ current }: LandingProgressStepsProps) {
  const activeStep = steps[current - 1];
  const connectionStep = steps[3];
  return (
    <nav aria-label="Шаги оформления" className="landing-progress">
      <div className="landing-progress__mobile-summary">
        <span className="text-sm font-semibold text-dark-100">Шаг {current} из 4</span>
        <span className="text-sm font-medium text-dark-300">{activeStep.title}</span>
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
                <span className="block text-sm font-semibold">{step.title}</span>
                <span className="mt-1 block text-xs leading-relaxed text-dark-400">
                  {step.description}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="landing-progress__mobile-detail">
        <p className="font-medium text-dark-100">{activeStep.description}</p>
        {current < 4 && (
          <p className="mt-1 text-dark-400">
            Финальный шаг: {connectionStep.description.toLowerCase()}.
          </p>
        )}
      </div>
    </nav>
  );
}
