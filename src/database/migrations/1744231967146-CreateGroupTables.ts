import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGroupTables1744231967146 implements MigrationInterface {
    name = 'CreateGroupTables1744231967146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "group_roles" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(50) NOT NULL, "description" text, CONSTRAINT "UQ_b1281d1ca63889a28f42d8aad26" UNIQUE ("slug"), CONSTRAINT "PK_c88b2351f40bf170bc7ab7e8fda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "group_memberships" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "group_id" integer NOT NULL, "group_role_id" integer NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e9a383a45af8eff11505d527620" UNIQUE ("user_id", "group_id"), CONSTRAINT "PK_4a04ebe9f25ad41f45b2c0ca4b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "groups" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "created_by_user_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_659d1483316afb28afd3a90646e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "group_memberships" ADD CONSTRAINT "FK_e232a617b3bc2de2e13c0289d62" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_memberships" ADD CONSTRAINT "FK_cad344fe877fcee0ac7e065ed05" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "group_memberships" ADD CONSTRAINT "FK_a160575a65fa0df38f09efd9ec9" FOREIGN KEY ("group_role_id") REFERENCES "group_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "groups" ADD CONSTRAINT "FK_b5dcac54b67d5c9ac85454fcb55" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP CONSTRAINT "FK_b5dcac54b67d5c9ac85454fcb55"`);
        await queryRunner.query(`ALTER TABLE "group_memberships" DROP CONSTRAINT "FK_a160575a65fa0df38f09efd9ec9"`);
        await queryRunner.query(`ALTER TABLE "group_memberships" DROP CONSTRAINT "FK_cad344fe877fcee0ac7e065ed05"`);
        await queryRunner.query(`ALTER TABLE "group_memberships" DROP CONSTRAINT "FK_e232a617b3bc2de2e13c0289d62"`);
        await queryRunner.query(`DROP TABLE "groups"`);
        await queryRunner.query(`DROP TABLE "group_memberships"`);
        await queryRunner.query(`DROP TABLE "group_roles"`);
    }

}
