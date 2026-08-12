# Реализация: Управление автопродлением и картами в админке

## Что было сделано (Фронтенд)

### 1. API типы (`src/api/adminUsers.ts`)
- ✅ Добавлен интерфейс `SavedPaymentCard` для сохранённых карт
- ✅ Расширен `UserSubscriptionInfo`:
  - `autopay_days_before: number | null`
  - `saved_cards: SavedPaymentCard[]`
- ✅ Добавлены API методы:
  - `disableAutopay(userId, subId)` - отключение автопродления
  - `getSavedCards(userId, subId?)` - получение сохранённых карт
  - `deleteSavedCard(userId, cardId, subId?)` - удаление карты

### 2. Компонент SubscriptionTab (`src/components/admin/userDetail/SubscriptionTab.tsx`)
- ✅ Новые props: `onDisableAutopay`, `onLoadSavedCards`, `onDeleteSavedCard`, `savedCards`, `savedCardsLoading`
- ✅ UI секция "Автопродление" - отображается если `autopay_enabled: true`
  - Показывает статус и кнопку "Отключить"
- ✅ UI секция "Сохранённые карты" - отображается если есть карты
  - Список карт с иконкой, типом, последними 4 цифрами, сроком действия
  - Метка "Основная" для дефолтной карты
  - Кнопка удаления для каждой карты

### 3. Страница AdminUserDetail (`src/pages/AdminUserDetail.tsx`)
- ✅ Добавлено состояние `savedCards` и `savedCardsLoading`
- ✅ Функции:
  - `handleDisableAutopay()` - отключение автопродления с подтверждением
  - `loadSavedCards()` - загрузка карт при открытии подписки
  - `handleDeleteSavedCard(cardId)` - удаление карты с обновлением данных
- ✅ Интеграция с `loadSubscriptionData()` - автоматическая загрузка карт

### 4. Переводы
- ✅ **Русский** (`src/locales/ru.json`):
  - `autopayEnabled`, `autopayDaysBefore`, `autopayActive`, `disableAutopay`, `autopayDisabled`
  - `savedCards`, `defaultCard`, `cardDeleted`
- ✅ **Английский** (`src/locales/en.json`):
  - Аналогичные переводы на английском

---

## Промпт для бэкенда (Opus в соседнем окне)

```
Привет! Нужно добавить эндпоинты для управления автопродлением и сохранёнными картами пользователей в админской части. Это форк, делаем merge-safe реализацию.

Контекст:
- Фронтенд уже обновлён с новыми API вызовами
- Типы на фронтенде: SavedPaymentCard, UserSubscriptionInfo (с autopay_enabled, autopay_days_before, saved_cards)
- API вызовы из adminUsers.ts:
  1. POST /cabinet/admin/users/{userId}/subscriptions/{subId}/disable-autopay
  2. GET /cabinet/admin/users/{userId}/saved-cards?subscription_id={subId}
  3. DELETE /cabinet/admin/users/{userId}/saved-cards/{cardId}?subscription_id={subId}

Задача:
Реализовать эти 3 эндпоинта в админском API бэкенда.

Требования:

1. **POST /cabinet/admin/users/{userId}/subscriptions/{subId}/disable-autopay**
   - Отключает автопродление для конкретной подписки пользователя
   - Проверяет права доступа (только админ)
   - Возвращает { success: true, message: "..." }
   - Должен обновить поле autopay_enabled = false в подписке
   - Если используется Platega/платёжный шлюз - также отключить рекуррентные платежи на их стороне

2. **GET /cabinet/admin/users/{userId}/saved-cards**
   - Опциональный query параметр: subscription_id
   - Возвращает массив SavedPaymentCard:
     ```typescript
     interface SavedPaymentCard {
       id: string;
       card_type: string;  // visa, mastercard, mir и т.д.
       last4: string;      // последние 4 цифры
       expires_month: number;
       expires_year: number;
       is_default: boolean;
       created_at: string; // ISO datetime
     }
     ```
   - Данные берутся из платёжного шлюза (Platega/Lava или другой)
   - Если нет subscription_id - вернуть карты всех подписок пользователя

3. **DELETE /cabinet/admin/users/{userId}/saved-cards/{cardId}**
   - Опциональный query параметр: subscription_id
   - Удаляет сохранённую карту через API платёжного шлюза
   - Возвращает { success: true, message: "..." }
   - Проверка прав доступа

Merge-safe требования:
- Создать отдельные файлы для новых контроллеров/сервисов где возможно
- Использовать существующие паттерны авторизации и обработки ошибок
- Не менять существующие эндпоинты
- Добавить логирование
- Обработка ошибок от платёжных шлюзов

Файлы которые нужно изменить (найди актуальные):
- Админский роутер/контроллер пользователей
- Сервис работы с платежами/подписками
- Middleware авторизации если нужно

Сделай минимальные изменения чтобы при мерге апстрима было меньше конфликтов.
```

---

## Изменённые файлы (Фронтенд)

1. `src/api/adminUsers.ts` - новые типы и API методы
2. `src/components/admin/userDetail/SubscriptionTab.tsx` - UI для управления
3. `src/pages/AdminUserDetail.tsx` - логика и интеграция
4. `src/locales/ru.json` - русские переводы
5. `src/locales/en.json` - английские переводы

---

## Merge-safe стратегия

Все изменения изолированы в отдельных компонентах:
- Новые API методы добавлены рядом с существующими
- Новый UI добавлен как отдельные секции
- Переводы добавлены в конец существующих блоков
- Нет изменений в существующей логике

При мерге апстрима конфликты будут только если менялись те же самые строки, что маловероятно для новых функций.
