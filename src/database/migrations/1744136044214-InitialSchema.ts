import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1744136044214 implements MigrationInterface {
    name = 'InitialSchema1744136044214'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Restore original UP method content
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, "slug" character varying(50) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "UQ_881f72bac969d9a00a1a29e1079" UNIQUE ("slug"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."applications_desired_membership_type_enum" AS ENUM('community', 'supporter', 'member')`);
        await queryRunner.query(`CREATE TYPE "public"."applications_status_enum" AS ENUM('pending', 'call_scheduled', 'approved', 'declined')`);
        await queryRunner.query(`CREATE TABLE "applications" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "desired_membership_type" "public"."applications_desired_membership_type_enum" NOT NULL, "status" "public"."applications_status_enum" NOT NULL DEFAULT 'pending', "motivation" text, "additional_data" jsonb, "call_scheduled_at" TIMESTAMP, "processed_by_admin_id" integer, "decision_notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_9e7594d5b474d9cbebba15c1ae" UNIQUE ("user_id"), CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "phone_number" character varying(50), "email_verified_at" TIMESTAMP, "password" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_user" ("user_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "PK_0d02ac0493a7a8193048bbc7da5" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5261e26da61ccaf8aeda8bca8e" ON "role_user" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_78ee37f2db349d230d502b1c7e" ON "role_user" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_9e7594d5b474d9cbebba15c1ae7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_a6d2fdab09e046f18f89da64b84" FOREIGN KEY ("processed_by_admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_user" ADD CONSTRAINT "FK_5261e26da61ccaf8aeda8bca8ea" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_user" ADD CONSTRAINT "FK_78ee37f2db349d230d502b1c7ea" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "role_user" DROP CONSTRAINT "FK_78ee37f2db349d230d502b1c7ea"`);
        await queryRunner.query(`ALTER TABLE "role_user" DROP CONSTRAINT "FK_5261e26da61ccaf8aeda8bca8ea"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_a6d2fdab09e046f18f89da64b84"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_9e7594d5b474d9cbebba15c1ae7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78ee37f2db349d230d502b1c7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5261e26da61ccaf8aeda8bca8e"`);
        await queryRunner.query(`DROP TABLE "role_user"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."applications_desired_membership_type_enum"`);
        await queryRunner.query(`DROP TABLE "roles"`);
    }

}
