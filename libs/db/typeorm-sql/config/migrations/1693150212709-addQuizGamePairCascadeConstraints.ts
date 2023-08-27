import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizGamePairCascadeConstraints1693150212709
  implements MigrationInterface
{
  name = 'AddQuizGamePairCascadeConstraints1693150212709';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP CONSTRAINT "FK_5413af170a8114521586d16ac7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP CONSTRAINT "FK_042775eaa092d0e2f025a417b7b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP CONSTRAINT "FK_78a73acb46d5ae4ab741923945d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP CONSTRAINT "FK_5b3d416c8b3ca5f605278d5d2d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b3d416c8b3ca5f605278d5d2d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78a73acb46d5ae4ab741923945"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c50aac3c40cbb0e9e6497a635"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_473ee52387eb2315bd3da72aa8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP COLUMN "questionPosition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD "questionPosition" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banReason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b3d416c8b3ca5f605278d5d2d" ON "quiz_game_pair_questions_typeorm" ("quizGamePairId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78a73acb46d5ae4ab741923945" ON "quiz_game_pair_questions_typeorm" ("questionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c50aac3c40cbb0e9e6497a635" ON "banned_users_by_blogger_typeorm" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_473ee52387eb2315bd3da72aa8" ON "banned_users_by_blogger_typeorm" ("blogId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_042775eaa092d0e2f025a417b7b" FOREIGN KEY ("player1Id") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_5413af170a8114521586d16ac7d" FOREIGN KEY ("player2Id") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD CONSTRAINT "FK_5b3d416c8b3ca5f605278d5d2d0" FOREIGN KEY ("quizGamePairId") REFERENCES "quiz_game_pair_typeorm"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD CONSTRAINT "FK_78a73acb46d5ae4ab741923945d" FOREIGN KEY ("questionId") REFERENCES "quiz_game_question_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
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
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP CONSTRAINT "FK_78a73acb46d5ae4ab741923945d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP CONSTRAINT "FK_5b3d416c8b3ca5f605278d5d2d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP CONSTRAINT "FK_5413af170a8114521586d16ac7d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP CONSTRAINT "FK_042775eaa092d0e2f025a417b7b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_473ee52387eb2315bd3da72aa8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c50aac3c40cbb0e9e6497a635"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78a73acb46d5ae4ab741923945"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5b3d416c8b3ca5f605278d5d2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" DROP COLUMN "banReason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" DROP COLUMN "questionPosition"`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banDate" TIMESTAMP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD "banReason" character varying(500)`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD "questionPosition" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_473ee52387eb2315bd3da72aa8" ON "banned_users_by_blogger_typeorm" ("blogId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c50aac3c40cbb0e9e6497a635" ON "banned_users_by_blogger_typeorm" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_78a73acb46d5ae4ab741923945" ON "quiz_game_pair_questions_typeorm" ("questionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5b3d416c8b3ca5f605278d5d2d" ON "quiz_game_pair_questions_typeorm" ("quizGamePairId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_2c50aac3c40cbb0e9e6497a635f" FOREIGN KEY ("userId") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "banned_users_by_blogger_typeorm" ADD CONSTRAINT "FK_473ee52387eb2315bd3da72aa8f" FOREIGN KEY ("blogId") REFERENCES "blogs_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD CONSTRAINT "FK_5b3d416c8b3ca5f605278d5d2d0" FOREIGN KEY ("quizGamePairId") REFERENCES "quiz_game_pair_typeorm"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD CONSTRAINT "FK_78a73acb46d5ae4ab741923945d" FOREIGN KEY ("questionId") REFERENCES "quiz_game_question_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_042775eaa092d0e2f025a417b7b" FOREIGN KEY ("player1Id") REFERENCES "users_typeorm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_5413af170a8114521586d16ac7d" FOREIGN KEY ("player2Id") REFERENCES "users_typeorm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
