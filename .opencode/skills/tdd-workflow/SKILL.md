---
name: tdd-workflow
description: Testing conventions for camirix-ai — Jest with ts-jest, NestJS testing utilities, TDD-first approach
---

## TDD-first approach (по умолчанию)

**Правило:** если пользователь не сказал явно иначе, разработка ведётся через TDD.

Цикл:
1. **Red** — написать тест под ожидаемое поведение (тест падает)
2. **Green** — написать минимальную реализацию, чтобы тест прошёл
3. **Refactor** — улучшить код, тесты остаются зелёными

Исключения (когда TDD не применяется):
- Пользователь явно сказал "без тестов" или "prototype/sketch"
- Hotfix продакшена (срочный багфикс)

## TypeScript Backend Tests

Фреймворк: **Jest** (единственный, не Vitest, не ts-node).

```bash
npm test              # Запуск тестов
npm run test:watch    # Watch mode
npm run test:cov      # С coverage
npm run test:e2e      # E2E тесты
```
- Jest с `ts-jest` трансформером
- Тест-файлы: `*.spec.ts` рядом с тестируемым файлом
- NestJS `@nestjs/testing` → `Test.createTestingModule()` для модульных тестов

## Mocking
- LangChain/OpenAI вызовы мокать через jest mock на уровне `LlmService`
- Langfuse `CallbackHandler` мокать через пустой объект
- Redis connections мокать через `ioredis-mock` или фабрику
- Для тестов PostgreSQL использовать testcontainers или TypeORM SQLite fallback

## Структура теста
```typescript
describe('ModuleName', () => {
  let service: ModuleNameService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [...],
      providers: [...],
    }).compile();
    service = module.get(ModuleNameService);
  });

  it('should ...', async () => {
    const result = await service.someMethod(input);
    expect(result).toEqual(expected);
  });
});
```

## End-to-end
- Поднимать NestJS приложение через `Test.createTestingModule` + `INestApplication`
- Использовать `request` из `supertest` для HTTP тестов
- E2E конфиг: `test/jest-e2e.json`
