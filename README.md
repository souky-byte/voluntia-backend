# Voluntia Backend

[![NestJS Logo](https://nestjs.com/img/logo-small.svg)](https://nestjs.com)

Backend API pro platformu politické strany Voluntia, postavené pomocí [NestJS](https://nestjs.com) frameworku.

## Popis

Tento projekt poskytuje RESTful API pro správu žádostí o členství, uživatelských profilů a projektových skupin. Slouží jako základ pro frontendovou aplikaci (web/mobilní).

### Klíčové Funkce

*   Správa žádostí o členství (Community, Supporter, Member).
*   Schvalovací proces pro žádosti.
*   Automatické vytváření uživatelů a přiřazování rolí.
*   Správa uživatelských profilů (včetně změny hesla).
*   Zakládání a správa projektových skupin.
*   Členství a role v rámci projektových skupin.
*   Autentizace pomocí JWT (Bearer Token).
*   Autorizace na základě globálních rolí a rolí ve skupinách (pro budoucí endpointy).
*   API dokumentace pomocí Swagger/OpenAPI.

## Instalace

```bash
# Clone repository
git clone https://github.com/souky-byte/voluntia-backend.git
cd voluntia-backend

# Install dependencies
npm install
```

## Spuštění Aplikace

1.  **Vytvořte `.env` soubor:** Zkopírujte `.env.example` (pokud existuje) nebo vytvořte nový a nastavte potřebné proměnné prostředí (minimálně `DATABASE_URL`, `JWT_SECRET`).

    ```dotenv
    # Příklad
    DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
    JWT_SECRET=vas_super_tajny_klic
    JWT_EXPIRATION_TIME=3600s
    PORT=3010
    API_PREFIX=/api/v1
    # ... další proměnné (MAIL, etc.) ...
    ```

2.  **Spusťte databázové migrace:**
    ```bash
    npm run migration:run
    ```

3.  **(Volitelně) Spusťte seed skript** pro vytvoření základních rolí a admin uživatele:
    ```bash
    npm run seed:run
    ```

4.  **Spuštění v development režimu (s watch modem):**
    ```bash
    npm run start:dev
    ```

5.  **Spuštění v produkčním režimu:**
    ```bash
    npm run build
    npm run start:prod
    ```

Aplikace poběží na portu definovaném v `.env` (výchozí 3010). API dokumentace bude dostupná na `/api/v1/docs` (nebo podle `API_PREFIX`).

## Testování

```bash
# Unit tests
npm run test

# E2E tests (vyžaduje běžící DB)
npm run test:e2e

# Test coverage
npm run test:cov
```

## Technologický Stack

*   Framework: [NestJS](https://nestjs.com)
*   Jazyk: [TypeScript](https://www.typescriptlang.org/)
*   Databáze: PostgreSQL (s [TypeORM](https://typeorm.io/))
*   Autentizace: JWT ([@nestjs/jwt](https://github.com/nestjs/jwt), [Passport](http://www.passportjs.org/))
*   Validace: [class-validator](https://github.com/typestack/class-validator), [class-transformer](https://github.com/typestack/class-transformer)
*   API Dokumentace: [Swagger (@nestjs/swagger)](https://docs.nestjs.com/openapi/introduction)
*   Bezpečnost: [Helmet](https://helmetjs.github.io/), [Throttler (@nestjs/throttler)](https://docs.nestjs.com/security/rate-limiting)

## Nasazení

Aplikace je konfigurována pro snadné nasazení na [Vercel](https://vercel.com) pomocí `vercel.json`.

## Licence

[UNLICENSED]().
