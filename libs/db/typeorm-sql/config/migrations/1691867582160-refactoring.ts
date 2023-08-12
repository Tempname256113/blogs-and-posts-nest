import { MigrationInterface, QueryRunner } from 'typeorm';

export class Refactoring1691867582160 implements MigrationInterface {
  name = 'Refactoring1691867582160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c50aac3c40cbb0e9e6497a635"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_473ee52387eb2315bd3da72aa8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banReason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_typeorm" ALTER COLUMN "lastActiveDate" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_typeorm" ALTER COLUMN "addedAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_typeorm" ALTER COLUMN "createdAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments_typeorm" ALTER COLUMN "createdAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_typeorm" ALTER COLUMN "createdAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_typeorm" ALTER COLUMN "createdAt" DROP DEFAULT`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c50aac3c40cbb0e9e6497a635" ON "banned_users_by_blogger_typeorm" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_473ee52387eb2315bd3da72aa8" ON "banned_users_by_blogger_typeorm" ("blogId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f" FOREIGN KEY ("userId") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f" FOREIGN KEY ("blogId") REFERENCES "blogs_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_473ee52387eb2315bd3da72aa8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c50aac3c40cbb0e9e6497a635"`,
    );
    await queryRunner.query(
      `ALTER TABLE "blogs_typeorm" ALTER COLUMN "createdAt" SET DEFAULT '2023-08-12 17:05:34.12'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users_typeorm" ALTER COLUMN "createdAt" SET DEFAULT '2023-08-12 17:05:34.121'`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments_typeorm" ALTER COLUMN "createdAt" SET DEFAULT '2023-08-12 17:05:34.12'`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts_typeorm" ALTER COLUMN "createdAt" SET DEFAULT '2023-08-12 17:05:34.12'`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes_typeorm" ALTER COLUMN "addedAt" SET DEFAULT '2023-08-12 17:05:34.119'`,
    );
    await queryRunner.query(
      `ALTER TABLE "sessions_typeorm" ALTER COLUMN "lastActiveDate" SET DEFAULT '2023-08-12 17:05:34.114'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banDate" TIMESTAMP NOT NULL DEFAULT '2023-08-12 17:05:34.764'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banReason" character varying(500)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_473ee52387eb2315bd3da72aa8" ON "banned_users_by_blogger_typeorm" ("blogId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c50aac3c40cbb0e9e6497a635" ON "banned_users_by_blogger_typeorm" ("userId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f" FOREIGN KEY ("userId") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f" FOREIGN KEY ("blogId") REFERENCES "blogs_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
