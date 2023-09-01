import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeQuizGamePairEntityPK1693502049627
  implements MigrationInterface
{
  name = 'ChangeQuizGamePairEntityPK1693502049627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_answers_typeorm" DROP CONSTRAINT "FK_4cc33d65650043766a9997a71c3"',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_questions_typeorm" DROP CONSTRAINT "quiz_game_pair_questions_typeorm_quizGamePairId_fkey"',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_typeorm" ALTER COLUMN id DROP DEFAULT',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_typeorm" ALTER COLUMN id TYPE uuid USING uuid_generate_v4()',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_typeorm" ALTER COLUMN id SET DEFAULT gen_random_uuid()',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_answers_typeorm" ALTER COLUMN "quizGamePairId" TYPE uuid USING "quizGamePairId"::text::uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_questions_typeorm" ALTER COLUMN "quizGamePairId" TYPE uuid USING "quizGamePairId"::text::uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_answers_typeorm" ADD CONSTRAINT quiz_game_pair_answers_typeorm_quiz_game_pair_id_fkey FOREIGN KEY ("quizGamePairId") REFERENCES "quiz_game_pair_typeorm" (id)',
    );
    await queryRunner.query(
      'ALTER TABLE "quiz_game_pair_questions_typeorm" ADD CONSTRAINT quiz_game_pair_questions_typeorm_quiz_game_pair_id_fkey FOREIGN KEY ("quizGamePairId") REFERENCES "quiz_game_pair_typeorm" (id)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP CONSTRAINT "PK_0146d470d1a95ce50f1cece195e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" DROP COLUMN "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD "id" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_game_pair_typeorm" ADD CONSTRAINT "PK_0146d470d1a95ce50f1cece195e" PRIMARY KEY ("id")`,
    );
  }
}
