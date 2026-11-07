import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeads1731000000000 implements MigrationInterface {
  name = 'CreateLeads1731000000000';

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "phone" varchar(30) NOT NULL,
        "email" varchar(254),
        "message" varchar(2000) NOT NULL,
        "property_code" varchar(20),
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "leads_created_at_idx" ON "leads" ("created_at" DESC)`);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE "leads"`);
  }
}
