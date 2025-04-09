# Voluntia NestJS Backend - Implementation Plan

Tento dokument popisuje kroky potřebné k implementaci backendu pro aplikaci Voluntia pomocí frameworku NestJS.

## 1. Základní Nastavení Projektu

- [ ] Ověřit existující strukturu NestJS projektu.
- [ ] Instalovat potřebné závislosti:
  - [ ] `@nestjs/typeorm typeorm pg` (ORM a PostgreSQL driver)
  - [ ] `@nestjs/config` (Správa konfigurace a .env)
  - [ ] `class-validator class-transformer` (Validace DTO)
  - [ ] `@nestjs/passport passport passport-local` (Lokální autentizace - pro adminy)
  - [ ] `@nestjs/jwt passport-jwt @types/passport-jwt` (JWT pro API tokeny)
  - [ ] `@nestjs/swagger swagger-ui-express` (API dokumentace)
  - [ ] `bcrypt @types/bcrypt` (Hashování hesel)
  - [ ] `@nestjs/schedule` (Pro případné plánované úlohy - volitelné)
  - [ ] `nestjs-mailer nodemailer @types/nodemailer` (Odesílání emailů)
- [ ] Vytvořit `.env` soubor a nastavit proměnné prostředí (DB connection string, JWT secret, SMTP config, atd.).
- [ ] Nakonfigurovat `ConfigModule` globálně v `app.module.ts`.
- [ ] Nakonfigurovat `TypeOrmModule` globálně v `app.module.ts` s použitím údajů z `.env`.
- [ ] Nastavit základní TypeORM konfiguraci (synchronizace/migrace). Pro produkci použijeme migrace.
- [ ] Vytvořit `CoreModule` pro globální prvky (filtry, interceptory).
- [ ] Implementovat globální `HttpExceptionFilter` v `CoreModule`.

## 2. Databázový Model (TypeORM Entities)

- [ ] Vytvořit adresář `src/database/entities`.
- [ ] Definovat entitu `User` (`src/database/entities/user.entity.ts`) včetně relací a sloupců (`phone_number`, `password` nullable).
- [ ] Definovat entitu `Role` (`src/database/entities/role.entity.ts`).
- [ ] Definovat entitu `Application` (`src/database/entities/application.entity.ts`) včetně:
    - [ ] Enum pro `desired_membership_type` (`community`, `supporter`, `member`).
    - [ ] Enum pro `status` (`pending`, `call_scheduled`, `approved`, `declined`).
    - [ ] Sloupec `additional_data` typu `jsonb`.
    - [ ] Relace na `User` (žadatel) a `User` (admin, co zpracoval).
- [ ] Definovat Many-to-Many relaci mezi `User` a `Role` (implicitně přes `role_user` tabulku v TypeORM).
- [ ] Vytvořit počáteční TypeORM migraci pro vytvoření tabulek.
- [ ] Vytvořit seedovací skript pro základní role (např. 'admin', 'community', 'supporter', 'member').

## 3. Modul Autentizace a Autorizace (`AuthModule`)

- [ ] Vytvořit `AuthModule` (`nest g module auth`).
- [ ] Vytvořit `AuthService` (`nest g service auth`).
    - [ ] Implementovat metodu `validateUser(email, password)` pro lokální strategii (login admina).
    - [ ] Implementovat metodu `login(user)` pro generování JWT.
    - [ ] Implementovat metodu pro ověření JWT payloadu.
- [ ] Vytvořit `AuthController` (`nest g controller auth`).
    - [ ] Endpoint `POST /auth/login` pro přihlášení admina (použije `LocalAuthGuard`).
    - [ ] Endpoint `GET /auth/profile` (nebo `/user`) pro získání profilu přihlášeného uživatele (použije `JwtAuthGuard`).
- [ ] Implementovat `LocalStrategy` (`src/auth/strategies/local.strategy.ts`).
- [ ] Implementovat `JwtStrategy` (`src/auth/strategies/jwt.strategy.ts`).
- [ ] Vytvořit `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`).
- [ ] Vytvořit `LocalAuthGuard` (`src/auth/guards/local-auth.guard.ts`).
- [ ] Vytvořit `RolesGuard` (`src/auth/guards/roles.guard.ts`).
- [ ] Vytvořit `Roles` decorator (`src/auth/decorators/roles.decorator.ts`).
- [ ] Definovat enum `RoleType` (`src/auth/enums/role-type.enum.ts`).
- [ ] Nakonfigurovat `JwtModule` v `AuthModule` (secret, expiration).
- [ ] Nakonfigurovat `PassportModule` v `AuthModule`.

## 4. Modul Uživatelů (`UserModule`)

- [ ] Vytvořit `UserModule` (`nest g module user`).
- [ ] Vytvořit `UserService` (`nest g service user`).
    - [ ] Metoda `create(createUserDto)` (pro adminy nebo interní použití).
    - [ ] Metoda `findOneByEmail(email)`.
    - [ ] Metoda `findOneById(id)`.
    - [ ] Metoda `assignRole(userId, roleType)`.
    - [ ] Metoda `setUserPassword(userId, password)` (nebo generování reset tokenu).
- [ ] Vytvořit `UserController` (`nest g controller user`) - případně jen pro adminy nebo interní účely, pokud `/auth/profile` stačí.
- [ ] Importovat `TypeOrmModule.forFeature([User, Role])` do `UserModule`.
- [ ] Exportovat `UserService`.

## 5. Veřejný Modul Žádostí (`PublicApplicationModule`)

- [ ] Vytvořit `PublicApplicationModule` (`nest g module public-application`).
- [ ] Vytvořit `PublicApplicationService` (`nest g service public-application`).
    - [ ] Metoda `createApplication(createApplicationDto)`. Zahrnuje:
        - Validaci dat dle `desired_membership_type`.
        - Vytvoření `User` záznamu (bez hesla, `email_verified_at` = null).
        - Vytvoření `Application` záznamu.
- [ ] Vytvořit `PublicApplicationController` (`nest g controller public-application`).
    - [ ] Endpoint `POST /applications` pro podání žádosti.
- [ ] Vytvořit `CreateApplicationDto` (`src/public-application/dto/create-application.dto.ts`) s validátory:
    - [ ] Základní pole (`name`, `email`, `desired_membership_type`).
    - [ ] Podmíněná validace pro `phone_number`, `motivation`, `additional_data` (a jeho vnitřních polí jako `full_address`, `date_of_birth`, atd.) na základě `desired_membership_type`.
- [ ] Importovat `TypeOrmModule.forFeature([Application, User])` do `PublicApplicationModule`.
- [ ] Importovat `UserModule` (pro `UserService`).

## 6. Administrátorský Modul Žádostí (`AdminApplicationModule`)

- [ ] Vytvořit `AdminApplicationModule` (`nest g module admin-application`).
- [ ] Vytvořit `AdminApplicationService` (`nest g service admin-application`).
    - [ ] Metoda `findAll(paginationOptions, filterOptions)`.
    - [ ] Metoda `findOne(id)`.
    - [ ] Metoda `scheduleCall(id, scheduleCallDto, adminUser)`.
    - [ ] Metoda `approveApplication(id, decisionDto, adminUser)`. Zahrnuje:
        - Aktualizaci statusu žádosti.
        - Přiřazení role uživateli (`UserService.assignRole`).
        - Generování hesla/odkazu a jeho nastavení (`UserService.setUserPassword`).
        - Odeslání uvítacího emailu (`MailerService.sendWelcomeEmail`).
        - Uložení poznámky a admina, který akci provedl.
    - [ ] Metoda `declineApplication(id, decisionDto, adminUser)`. Zahrnuje:
        - Aktualizaci statusu žádosti.
        - Uložení poznámky a admina.
- [ ] Vytvořit `AdminApplicationController` (`nest g controller admin-application --flat` - umístění do `src/admin-application/admin-application.controller.ts`).
    - [ ] Nastavit prefix `/admin/applications`.
    - [ ] Použít `JwtAuthGuard` a `RolesGuard(RoleType.Admin)` na celý controller.
    - [ ] Endpoint `GET /` (seznam žádostí s filtrováním a paginací).
    - [ ] Endpoint `GET /:id` (detail žádosti).
    - [ ] Endpoint `PUT /:id/schedule-call` (naplánování hovoru).
    - [ ] Endpoint `PUT /:id/approve` (schválení).
    - [ ] Endpoint `PUT /:id/decline` (zamítnutí).
    - [ ] Endpoint `GET /admin/test` (smoke test).
- [ ] Vytvořit DTOs (`ScheduleCallDto`, `DecisionDto`, `ApplicationQueryDto`).
- [ ] Importovat `TypeOrmModule.forFeature([Application, User, Role])` do `AdminApplicationModule`.
- [ ] Importovat `AuthModule` (pro guardy).
- [ ] Importovat `UserModule` (pro `UserService`).
- [ ] Importovat `SharedModule` (pro `MailerService`).

## 7. Sdílený Modul (`SharedModule`)

- [ ] Vytvořit `SharedModule` (`nest g module shared`).
- [ ] Implementovat `MailerService` (`src/shared/services/mailer.service.ts`).
    - [ ] Nakonfigurovat `MailerModule` (z `nestjs-mailer`) s použitím údajů z `.env`.
    - [ ] Metoda `sendWelcomeEmail(user, passwordOrToken)`.
- [ ] Exportovat `MailerService`.
- [ ] Případné další sdílené utility.

## 8. Testování

- [ ] Nastavit testovací prostředí (Jest).
- [ ] Napsat unit testy pro klíčové služby (`AuthService`, `UserService`, `PublicApplicationService`, `AdminApplicationService`).
- [ ] Napsat E2E testy pro API endpointy (`PublicApplicationController`, `AdminApplicationController`, `AuthController`).
- [ ] Zajistit test coverage.

## 9. Dokumentace API (Swagger)

- [ ] Nakonfigurovat Swagger v `main.ts`.
- [ ] Přidat `@Api...` dekorátory do DTOs a Controllerů pro detailní dokumentaci.
- [ ] Ověřit generovanou dokumentaci na `/api-docs`.

## 10. Finalizace a Příprava na Deployment

- [ ] Optimalizovat build proces.
- [ ] Nastavit logování.
- [ ] Připravit konfigurační soubory pro produkční prostředí.
- [ ] Vytvořit Dockerfile (volitelné).
- [ ] Zkontrolovat bezpečnostní aspekty (rate limiting, helmet, CORS). 