import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizPairQuestionsTableChanged1693244183257
  implements MigrationInterface
{
  name = 'QuizPairQuestionsTableChanged1693244183257';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "quiz_game_pair_questions_typeorm" ("id" SERIAL PRIMARY KEY, "quizGamePairId" INTEGER, "questionId" INTEGER, "questionPosition" INTEGER, FOREIGN KEY ("quizGamePairId") references "quiz_game_pair_typeorm"("id") ON DELETE CASCADE , FOREIGN KEY ("questionId") references "quiz_game_question_typeorm"("id") ON DELETE CASCADE )',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "quiz_game_pair_questions_typeorm"');
  }
}
