# Voluntia Backend - Feature Implementation Plan (Profiles & Groups)

Tento dokument popisuje kroky implementace pro rozšíření backendu o uživatelské profily a projektové skupiny.

## Část 1: Uživatelské Profily

Cíl: Umožnit uživatelům spravovat vlastní profilové údaje a měnit heslo.

### 1.1 Změny v Databázi

- [ ] **Rozšířit entitu `User` (`src/database/entities/user.entity.ts`):**
    - [ ] Přidat sloupec `avatar_url` (typ `varchar`, `nullable: true`).
    - [ ] Přidat sloupec `location` (typ `varchar`, `nullable: true`).
    - [ ] Přidat sloupec `bio` (typ `text`, `nullable: true`).
    - [ ] Přidat sloupec `tags` (typ `simple-array` nebo `jsonb`, `nullable: true`). `simple-array` je jednodušší pro stringová pole.
    - *Poznámka: Zvážit rozdělení `name` na `first_name` a `last_name` (prozatím ponecháme `name`).*
- [ ] **Vytvořit migraci:**
    - [ ] Vygenerovat migraci pomocí `npm run migration:generate --name=AddProfileFieldsToUsers`.
    - [ ] Zkontrolovat a případně upravit vygenerovanou migraci.
- [ ] **Spustit migraci:**
    - [ ] Spustit `npm run migration:run`.

### 1.2 Struktura Modulu

- [ ] **Vytvořit `ProfileModule`:**
    - [ ] Spustit `nest g module profile`.
- [ ] **Vytvořit `ProfileService`:**
    - [ ] Spustit `nest g service profile`.
- [ ] **Vytvořit `ProfileController`:**
    - [ ] Spustit `nest g controller profile`.
- [ ] **Konfigurovat `ProfileModule` (`src/profile/profile.module.ts`):**
    - [ ] Importovat `AuthModule` (kvůli guardům).
    - [ ] Importovat `UserModule` (kvůli `UserService`).

### 1.3 DTO (Data Transfer Objects)

- [ ] **Vytvořit adresář `src/profile/dto`**.
- [ ] **Vytvořit `UpdateProfileDto` (`src/profile/dto/update-profile.dto.ts`):**
    - Obsahuje volitelná pole: `name`, `avatar_url`, `location`, `bio`, `tags`.
    - Přidat validátory (`@IsOptional`, `@IsString`, `@MaxLength`, `@IsUrl` pro avatar, `@IsArray` pro tagy atd.).
    - Přidat `@ApiPropertyOptional`.
- [ ] **Vytvořit `ChangePasswordDto` (`src/profile/dto/change-password.dto.ts`):**
    - Obsahuje povinná pole: `currentPassword`, `newPassword`, `confirmPassword`.
    - Přidat validátory (`@IsNotEmpty`, `@MinLength`, vlastní validátor pro shodu `newPassword` a `confirmPassword`).
    - Přidat `@ApiProperty`.
- [ ] **Vytvořit adresář `src/profile/dto/response`**.
- [ ] **Vytvořit `UserProfileResponseDto` (`src/profile/dto/response/user-profile-response.dto.ts`):**
    - Obsahuje pole uživatele určená k zobrazení (bez `password`).
    - Zahrnuje nová pole: `avatar_url`, `location`, `bio`, `tags`.
    - Přidat `@ApiProperty` a `@ApiPropertyOptional`.

### 1.4 Implementace `ProfileService`

- [ ] Injektovat `UserService`.
- [ ] **Implementovat `getProfile(userId: number): Promise<User>`:**
    - Volá `userService.findOneById(userId)`.
- [ ] **Implementovat `updateProfile(userId: number, dto: UpdateProfileDto): Promise<User>`:**
    - Načte uživatele pomocí `userService.findOneById(userId)`.
    - Aktualizuje pouze poskytnutá pole z DTO.
    - Uloží změny pomocí `userService.save(user)` (nebo vytvořit dedikovanou metodu v `UserService`).
- [ ] **Implementovat `changePassword(userId: number, dto: ChangePasswordDto): Promise<void>`:**
    - Načte uživatele *včetně hesla* pomocí `userService.findOneByIdWithPassword(userId)` (nutno vytvořit nebo upravit v `UserService`).
    - Ověří shodu `dto.currentPassword` s uloženým hashem pomocí `bcrypt.compare`.
    - Pokud heslo nesouhlasí, vyhodí `UnauthorizedException`.
    - Nastaví `user.password = dto.newPassword`.
    - Uloží uživatele (nové heslo se automaticky zahashuje hookem v entitě).

### 1.5 Implementace `ProfileController`

- [ ] Nastavit base route `/profile`.
- [ ] **Implementovat `GET /me` endpoint:**
    - Použít `@UseGuards(JwtAuthGuard)`.
    - Získat `userId` z `req.user.sub`.
    - Zavolat `profileService.getProfile(userId)`.
    - Mapovat výsledek na `UserProfileResponseDto`.
    - Přidat Swagger (`@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`).
- [ ] **Implementovat `PUT /me` endpoint:**
    - Použít `@UseGuards(JwtAuthGuard)`.
    - Získat `userId` z `req.user.sub`.
    - Použít `@Body()` s `UpdateProfileDto`.
    - Zavolat `profileService.updateProfile(userId, dto)`.
    - Mapovat výsledek na `UserProfileResponseDto`.
    - Přidat Swagger.
- [ ] **Implementovat `PUT /me/password` endpoint:**
    - Použít `@UseGuards(JwtAuthGuard)`.
    - Získat `userId` z `req.user.sub`.
    - Použít `@Body()` s `ChangePasswordDto`.
    - Zavolat `profileService.changePassword(userId, dto)`.
    - Nastavit `@HttpCode(HttpStatus.NO_CONTENT)` pro úspěšnou odpověď bez těla.
    - Přidat Swagger.

### 1.6 Aktualizace `UserService`

- [ ] **Přidat `findOneByIdWithPassword(id: number): Promise<User | null>`:**
    - Podobné jako `findOneByEmailWithPassword`, ale hledá podle ID.
- [ ] **Zvážit `updateUserProfile(user: User, dto: UpdateProfileDto): Promise<User>`:**
    - Přesunutí logiky aktualizace profilu sem pro lepší zapouzdření.

## Část 2: Projektové Skupiny

Cíl: Umožnit zakládání skupin, připojování uživatelů a definování rolí v rámci skupin.

### 2.1 Změny v Databázi

- [ ] **Vytvořit entitu `GroupRole` (`src/database/entities/group-role.entity.ts`):**
    - `id` (PK), `name` (varchar), `slug` (varchar, unique), `description` (text, nullable).
- [ ] **Vytvořit entitu `Group` (`src/database/entities/group.entity.ts`):**
    - `id` (PK), `name` (varchar), `description` (text, nullable).
    - Relace `createdByUser` (ManyToOne k `User`, `nullable: false`).
    - Relace `memberships` (OneToMany k `GroupMembership`).
    - `created_at`, `updated_at`.
- [ ] **Vytvořit entitu `GroupMembership` (`src/database/entities/group-membership.entity.ts`):**
    - `id` (PK).
    - Relace `user` (ManyToOne k `User`, `nullable: false`).
    - Relace `group` (ManyToOne k `Group`, `nullable: false`).
    - Relace `role` (ManyToOne k `GroupRole`, `nullable: false`).
    - Sloupce `user_id`, `group_id`, `group_role_id`.
    - `joined_at` (CreateDateColumn).
    - Přidat `UniqueConstraint` na `['user_id', 'group_id']`.
- [ ] **Aktualizovat entitu `User`:**
    - Přidat relaci `createdGroups` (OneToMany k `Group`).
    - Přidat relaci `groupMemberships` (OneToMany k `GroupMembership`).
- [ ] **Vytvořit migraci:**
    - `npm run migration:generate --name=CreateGroupTables`.
    - Zkontrolovat migraci.
- [ ] **Spustit migraci:**
    - `npm run migration:run`.
- [ ] **Aktualizovat/vytvořit seed skript:**
    - Přidat seedování pro základní `GroupRole` ('leader', 'member').
    - `npm run seed:run`.

### 2.2 Struktura Modulu

- [ ] **Vytvořit `GroupModule`:**
    - `nest g module group`.
- [ ] **Vytvořit `GroupService`:**
    - `nest g service group`.
- [ ] **Vytvořit `GroupController`:**
    - `nest g controller group`.
- [ ] **Konfigurovat `GroupModule` (`src/group/group.module.ts`):**
    - Importovat `TypeOrmModule.forFeature([Group, GroupRole, GroupMembership, User])`.
    - Importovat `AuthModule`.

### 2.3 DTOs

- [ ] Vytvořit adresář `src/group/dto`.
- [ ] `CreateGroupDto` (`name`, `description`).
- [ ] `UpdateGroupDto` (optional `name`, `description`).
- [ ] Adresář `src/group/dto/response`.
- [ ] `GroupBasicResponseDto` (základní info o skupině).
- [ ] `GroupMemberResponseDto` (info o členovi + jeho role ve skupině).
- [ ] `GroupDetailResponseDto` (detail skupiny + seznam členů `GroupMemberResponseDto[]`).
- [ ] `UpdateMemberRoleDto` (`roleSlug`).

### 2.4 Implementace `GroupService`

- [ ] Injektovat repozitáře (`Group`, `GroupRole`, `GroupMembership`, `User`).
- [ ] **Implementovat `createGroup(userId: number, dto: CreateGroupDto): Promise<Group>`:**
    - Vytvoří skupinu, nastaví `createdByUser`.
    - Automaticky přidá tvůrce jako člena s rolí 'leader' (vytvoří záznam v `GroupMembership`).
- [ ] **Implementovat `findAllGroups(queryDto): Promise<PaginatedGroupsResult>`:**
    - Základní paginace, případně filtrování.
- [ ] **Implementovat `findGroupById(groupId: number): Promise<Group>`:**
    - Načte skupinu včetně členů a jejich rolí (`relations: ['memberships', 'memberships.user', 'memberships.role']`).
- [ ] **Implementovat `updateGroup(groupId: number, userId: number, dto: UpdateGroupDto): Promise<Group>`:**
    - Ověřit, zda `userId` je tvůrce nebo leader skupiny (viz 2.6).
- [ ] **Implementovat `deleteGroup(groupId: number, userId: number): Promise<void>`:**
    - Ověřit, zda `userId` je tvůrce nebo leader skupiny (viz 2.6).
- [ ] **Implementovat `joinGroup(groupId: number, userId: number): Promise<GroupMembership>`:**
    - Najde výchozí roli 'member'.
    - Zkontroluje, zda uživatel už není členem.
    - Vytvoří záznam `GroupMembership`.
- [ ] **Implementovat `leaveGroup(groupId: number, userId: number): Promise<void>`:**
    - Najde a smaže záznam `GroupMembership`.
    - Zvážit logiku, pokud odchází poslední leader.
- [ ] **Implementovat `findGroupMembers(groupId: number): Promise<GroupMembership[]>`:**
    - Načte členství včetně uživatelů a rolí.
- [ ] **Implementovat `updateMemberRole(groupId: number, targetUserId: number, performingUserId: number, dto: UpdateMemberRoleDto): Promise<GroupMembership>`:**
    - Ověřit, zda `performingUserId` je leader skupiny (viz 2.6).
    - Najde členství `targetUserId`.
    - Najde novou roli podle `dto.roleSlug`.
    - Aktualizuje `group_role_id` v členství.
- [ ] **Implementovat `removeMember(groupId: number, targetUserId: number, performingUserId: number): Promise<void>`:**
    - Ověřit, zda `performingUserId` je leader skupiny (viz 2.6).
    - Najde a smaže záznam `GroupMembership` pro `targetUserId`.

### 2.5 Implementace `GroupController`

- [ ] Nastavit base route `/groups`.
- [ ] Použít `@UseGuards(JwtAuthGuard)` na všechny/většinu endpointů.
- [ ] **Implementovat `POST /`:** Volá `createGroup`.
- [ ] **Implementovat `GET /`:** Volá `findAllGroups`.
- [ ] **Implementovat `GET /{groupId}`:** Volá `findGroupById`, mapuje na `GroupDetailResponseDto`.
- [ ] **Implementovat `PUT /{groupId}`:** Volá `updateGroup`, přidat guard/ověření.
- [ ] **Implementovat `DELETE /{groupId}`:** Volá `deleteGroup`, přidat guard/ověření.
- [ ] **Implementovat `POST /{groupId}/join`:** Volá `joinGroup`.
- [ ] **Implementovat `DELETE /{groupId}/leave`:** Volá `leaveGroup`.
- [ ] **Implementovat `GET /{groupId}/members`:** Volá `findGroupMembers`, mapuje na `GroupMemberResponseDto[]`.
- [ ] **Implementovat `PUT /{groupId}/members/{userId}/role`:** Volá `updateMemberRole`, přidat guard/ověření.
- [ ] **Implementovat `DELETE /{groupId}/members/{userId}`:** Volá `removeMember`, přidat guard/ověření.
- [ ] Přidat Swagger anotace.

### 2.6 Autorizace pro Správu Skupin

- [ ] **Vytvořit `isGroupLeader(groupId: number, userId: number): Promise<boolean>` metodu v `GroupService`:**
    - Zkontroluje, zda má uživatel v dané skupině roli 'leader'.
- [ ] **Použít tuto metodu v `GroupService` pro ověření oprávnění** u metod `updateGroup`, `deleteGroup`, `updateMemberRole`, `removeMember`.
- [ ] *Volitelně:* Vytvořit custom `Guard` (`GroupLeaderGuard`), který by toto ověření prováděl na úrovni controlleru, pokud je to preferováno.

--- 

Tento plán pokrývá základní funkcionalitu. Můžeme začít implementací Části 1: Uživatelské Profily. 