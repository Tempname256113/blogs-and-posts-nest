import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import {
  CreateQuizGameQuestionAdminApiDTO,
  PublishQuizGameQuestionAdminApiDTO,
  QuizGameAdminApiQueryDTO,
  UpdateQuizGameQuestionAdminApiDTO,
} from './models/quiz-game-admin-api.dto';
import {
  QuizGameAdminApiPaginationViewModel,
  QuizGameQuestionAdminApiViewModel,
} from './models/quiz-game-admin-api.models';
import { CommandBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/use-cases/create-question.use-case';
import { AdminQuizGameQueryRepositorySQL } from '../infrastructure/repositories/quiz-game-admin.query-repository';
import { DeleteQuizGameQuestionCommand } from '../application/use-cases/delete-question.use-case';
import { UpdateQuizGameQuestionCommand } from '../application/use-cases/update-question.use-case';
import { PublishQuizGameQuestionCommand } from '../application/use-cases/publish-question.use-case';

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
  ): Promise<QuizGameQuestionAdminApiViewModel> {
    return this.commandBus.execute<
      CreateQuestionCommand,
      QuizGameQuestionAdminApiViewModel
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

  @Put(':questionId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('questionId') questionId: string,
    @Body() updateQuizQuestionDTO: UpdateQuizGameQuestionAdminApiDTO,
  ): Promise<void> {
    await this.commandBus.execute<UpdateQuizGameQuestionCommand, void>(
      new UpdateQuizGameQuestionCommand({
        questionId,
        body: updateQuizQuestionDTO.body,
        correctAnswers: updateQuizQuestionDTO?.correctAnswers,
      }),
    );
  }

  @Put(':questionId/publish')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async publishQuestion(
    @Param('questionId') questionId: string,
    @Body() publishQuestionDTO: PublishQuizGameQuestionAdminApiDTO,
  ): Promise<void> {
    await this.commandBus.execute<PublishQuizGameQuestionCommand>(
      new PublishQuizGameQuestionCommand({
        questionId,
        publishQuestionStatus: publishQuestionDTO.published,
      }),
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
