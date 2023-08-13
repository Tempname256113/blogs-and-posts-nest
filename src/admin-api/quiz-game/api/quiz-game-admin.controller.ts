import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import {
  CreateQuizGameQuestionAdminApiDTO,
  QuizGameAdminApiQueryDTO,
} from './models/quiz-game-admin-api.dto';
import {
  QuizGameAdminApiPaginationViewModel,
  QuizGameAdminApiViewModel,
} from './models/quiz-game-admin-api.models';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case';
import { AdminQuizGameQueryRepositorySQL } from '../infrastructure/repositories/quiz-game-admin.query-repository';
import { DeleteQuizGameQuestionCommand } from '../application/use-cases/delete-question.use-case';

@Controller('sa/quiz/questions')
export class QuizGameAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizGameQueryRepositorySQL: AdminQuizGameQueryRepositorySQL,
  ) {}

  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createNewQuestion(
    @Body() createQuizGameQuestionDTO: CreateQuizGameQuestionAdminApiDTO,
  ): Promise<QuizGameAdminApiViewModel> {
    return this.commandBus.execute<
      CreateQuestionCommand,
      QuizGameAdminApiViewModel
    >(new CreateQuestionCommand(createQuizGameQuestionDTO));
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getAllQuestions(
    @Query() rawPaginationQuery: QuizGameAdminApiQueryDTO,
  ): Promise<QuizGameAdminApiPaginationViewModel> {
    const paginationQuery: QuizGameAdminApiQueryDTO = {
      bodySearchTerm: rawPaginationQuery.bodySearchTerm ?? null,
      publishedStatus: rawPaginationQuery.publishedStatus ?? 'all',
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
    };
    return this.quizGameQueryRepositorySQL.getAllQuestionsWithPagination(
      paginationQuery,
    );
  }

  @Delete(':questionId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('questionId') questionId: string): Promise<void> {
    await this.commandBus.execute<DeleteQuizGameQuestionCommand, void>(
      new DeleteQuizGameQuestionCommand(questionId),
    );
  }
}
