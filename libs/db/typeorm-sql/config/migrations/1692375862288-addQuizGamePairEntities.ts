import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQuizGamePairEntities1692375862288
  implements MigrationInterface
{
  name = 'AddQuizGamePairEntities1692375862288';

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
      `CREATE TABLE "quiz_game_pair_answers_typeorm" ("quizGamePairId" integer NOT NULL, "questionId" integer NOT NULL, "userId" integer NOT NULL, "answerStatus" character varying(10) NOT NULL, "addedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_306970f20ba0420abd15f110fce" PRIMARY KEY ("quizGamePairId", "questionId", "userId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_game_pair_typeorm" ("id" SERIAL NOT NULL, "player1Id" integer NOT NULL, "player2Id" integer, "player1Score" integer NOT NULL, "player2Score" integer NOT NULL, "status" character varying(19) NOT NULL, "pairCreatedDate" TIMESTAMP NOT NULL, "startGameDate" TIMESTAMP, "finishGameDate" TIMESTAMP, CONSTRAINT "PK_0146d470d1a95ce50f1cece195e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_game_pair_questions_typeorm" ("quizGamePairId" integer NOT NULL, "questionId" integer NOT NULL, "questionPosition" integer NOT NULL, CONSTRAINT "PK_51390a0a948178b6efe334a182c" PRIMARY KEY ("quizGamePairId", "questionId"))`,
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
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD "questionPosition" integer NOT NULL`,
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
      `ALTER TABLE "quiz_game_pair_answers_typeorm" ADD CONSTRAINT "FK_4cc33d65650043766a9997a71c3" FOREIGN KEY ("quizGamePairId") REFERENCES "quiz_game_pair_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_answers_typeorm" ADD CONSTRAINT "FK_2e5086fe99642c0524f2ee7d0c1" FOREIGN KEY ("questionId") REFERENCES "quiz_game_question_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_answers_typeorm" ADD CONSTRAINT "FK_14b2bf0e1cf29d04275533d07cc" FOREIGN KEY ("userId") REFERENCES "users_typeorm"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_042775eaa092d0e2f025a417b7b" FOREIGN KEY ("player1Id") REFERENCES "users_typeorm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "FK_5413af170a8114521586d16ac7d" FOREIGN KEY ("player2Id") REFERENCES "users_typeorm"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
      `ALTER TABLE "quiz_game_pair_answers_typeorm" DROP CONSTRAINT "FK_14b2bf0e1cf29d04275533d07cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_answers_typeorm" DROP CONSTRAINT "FK_2e5086fe99642c0524f2ee7d0c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_answers_typeorm" DROP CONSTRAINT "FK_4cc33d65650043766a9997a71c3"`,
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
      `ALTER TABLE "quiz_game_pair_questions_typeorm" ADD "questionPosition" integer NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "quiz_game_pair_questions_typeorm"`);
    await queryRunner.query(`DROP TABLE "quiz_game_pair_typeorm"`);
    await queryRunner.query(`DROP TABLE "quiz_game_pair_answers_typeorm"`);
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
