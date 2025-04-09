import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFieldsToUsers1744231018191 implements MigrationInterface {
    name = 'AddProfileFieldsToUsers1744231018191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar_url" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
        await queryRunner.query(`ALTER TABLE "users" ADD "tags" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar_url"`);
    }

}
