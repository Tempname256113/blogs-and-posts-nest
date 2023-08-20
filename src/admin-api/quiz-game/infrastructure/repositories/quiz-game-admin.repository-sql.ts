import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { DataSource, DeleteResult, Repository, UpdateResult } from 'typeorm';
import { QuizGameQuestionAdminApiViewModel } from '../../api/models/quiz-game-admin-api.models';
import { CreateQuizGameQuestionAdminApiDTO } from '../../api/models/quiz-game-admin-api.dto';

@Injectable()
export class AdminQuizGameRepositorySQL {
  constructor(
    @InjectRepository(QuizGameQuestionSQLEntity)
    private readonly quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async createQuestion({
    body: newQuestionBody,
    correctAnswers: newQuestionAnswers,
  }: CreateQuizGameQuestionAdminApiDTO): Promise<QuizGameQuestionAdminApiViewModel> {
    const newQuestion: QuizGameQuestionSQLEntity =
      new QuizGameQuestionSQLEntity();
    newQuestion.body = newQuestionBody;
    newQuestion.published = false;
    newQuestion.createdAt = new Date().toISOString();
    newQuestion.updatedAt = null;
    newQuestion.answers = newQuestionAnswers;

    const newCreatedQuestion: QuizGameQuestionSQLEntity =
      await this.quizGameQuestionEntity.save(newQuestion);

    return {
      id: String(newCreatedQuestion.id),
      body: newCreatedQuestion.body,
      correctAnswers: newQuestionAnswers,
      published: newCreatedQuestion.published,
      createdAt: newCreatedQuestion.createdAt,
      updatedAt: newCreatedQuestion.updatedAt,
    };
  }

  async deleteQuestion(questionId: string): Promise<boolean> {
    const deleteResult: DeleteResult = await this.quizGameQuestionEntity.delete(
      questionId,
    );
    return deleteResult.affected > 0;
  }

  async updateQuestion({
    body,
    correctAnswers: newAnswers,
    questionId,
  }: {
    body: string;
    correctAnswers?: string[];
    questionId: string;
  }): Promise<void> {
    await this.quizGameQuestionEntity.update(questionId, {
      body,
      updatedAt: new Date().toISOString(),
      answers: newAnswers ? newAnswers : [],
    });
  }

  async publishQuestion({
    questionId,
    publish,
  }: {
    questionId: string;
    publish: boolean;
  }): Promise<boolean> {
    const updateResult: UpdateResult = await this.quizGameQuestionEntity.update(
      questionId,
      {
        published: publish,
        updatedAt: new Date().toISOString(),
      },
    );
    return updateResult.affected === 1;
  }
}
