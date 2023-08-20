import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { FindOptionsOrder, FindOptionsWhere, ILike, Repository } from 'typeorm';
import {
  QuizGameAdminApiPaginationViewModel,
  QuizGameQuestionAdminApiViewModel,
} from '../../api/models/quiz-game-admin-api.models';
import { QuizGameAdminApiQueryDTO } from '../../api/models/quiz-game-admin-api.dto';

@Injectable()
export class AdminQuizGameQueryRepositorySQL {
  constructor(
    @InjectRepository(QuizGameQuestionSQLEntity)
    private readonly quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity>,
  ) {}

  async getAllQuestionsWithPagination(
    paginationQuery: QuizGameAdminApiQueryDTO,
  ): Promise<QuizGameAdminApiPaginationViewModel> {
    const correctFilter: FindOptionsWhere<QuizGameQuestionSQLEntity> = {};
    if (paginationQuery.bodySearchTerm) {
      correctFilter.body = ILike(`%${paginationQuery.bodySearchTerm}%`);
    }
    switch (paginationQuery.publishedStatus) {
      case 'published':
        correctFilter.published = true;
        break;
      case 'notPublished':
        correctFilter.published = false;
        break;
    }
    const correctOrderBy: FindOptionsOrder<QuizGameQuestionSQLEntity> = {};
    switch (paginationQuery.sortBy) {
      case 'createdAt':
        correctOrderBy.createdAt = paginationQuery.sortDirection;
        break;
      case 'updatedAt':
        correctOrderBy.updatedAt = paginationQuery.sortDirection;
        break;
      case 'body':
        correctOrderBy.body = paginationQuery.sortDirection;
        break;
    }
    const totalQuestionsCount: number =
      await this.quizGameQuestionEntity.countBy(correctFilter);
    const pagesCount: number = Math.ceil(
      totalQuestionsCount / paginationQuery.pageSize,
    );
    const howMuchToSkip: number =
      (paginationQuery.pageNumber - 1) * paginationQuery.pageSize;
    const foundedQuestions: QuizGameQuestionSQLEntity[] =
      await this.quizGameQuestionEntity.find({
        where: correctFilter,
        order: correctOrderBy,
        take: paginationQuery.pageSize,
        skip: howMuchToSkip,
        relations: ['answer'],
      });
    const mappedQuestions: QuizGameQuestionAdminApiViewModel[] =
      foundedQuestions.map((question) => {
        return {
          id: String(question.id),
          body: question.body,
          correctAnswers: question.answer.answers,
          published: question.published,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
        };
      });
    return {
      pagesCount: Number(pagesCount),
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: Number(totalQuestionsCount),
      items: mappedQuestions,
    };
  }

  async getQuestionById(
    questionId: string,
  ): Promise<QuizGameQuestionAdminApiViewModel | null> {
    const foundedQuizGameQuestion: QuizGameQuestionSQLEntity | null =
      await this.quizGameQuestionEntity.findOne({
        where: { id: Number(questionId) },
        relations: ['answer'],
      });
    if (!foundedQuizGameQuestion) return null;
    return {
      id: String(foundedQuizGameQuestion.id),
      body: foundedQuizGameQuestion.body,
      published: foundedQuizGameQuestion.published,
      correctAnswers: foundedQuizGameQuestion.answer.answers,
      createdAt: foundedQuizGameQuestion.createdAt,
      updatedAt: foundedQuizGameQuestion.updatedAt,
    };
  }
}
