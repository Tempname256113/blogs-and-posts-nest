import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { ReqAccessToken } from '../../../../generic-decorators/access-token.decorator';
import {
  QuizGamePublicApiPaginationViewModel,
  QuizGamePublicApiPlayerAnswerViewModel,
  QuizGamePublicApiUserStatisticViewModel,
  QuizGamePublicApiViewModel,
} from './models/quiz-game-public-api.models';
import { ConnectUserToQuizCommand } from '../application/use-cases/connect-user-to-quiz.use-case';
import {
  QuizGamePublicApiCreateAnswerDTO,
  QuizGamePublicApiPaginationQueryDTO,
} from './models/quiz-game-public-api.dto';
import { SendAnswerToNextQuizQuestionCommand } from '../application/use-cases/send-answer-to-next-quiz-question.use-case';
import { PublicQuizGameQueryRepositorySQL } from '../infrastructure/repositories/quiz-game-public.query-repository-sql';

@Controller('pair-game-quiz')
export class QuizGamePublicController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizGamePublicQueryRepositorySQL: PublicQuizGameQueryRepositorySQL,
  ) {}

  @Post('pairs/connection')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async connectUserToQuizGamePair(
    @ReqAccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiViewModel> {
    return this.commandBus.execute<
      ConnectUserToQuizCommand,
      QuizGamePublicApiViewModel
    >(new ConnectUserToQuizCommand({ accessToken }));
  }

  @Post('pairs/my-current/answers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async sendAnswer(
    @ReqAccessToken() accessToken: string | null,
    @Body() { answer }: QuizGamePublicApiCreateAnswerDTO,
  ): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    return this.commandBus.execute<
      SendAnswerToNextQuizQuestionCommand,
      QuizGamePublicApiPlayerAnswerViewModel
    >(new SendAnswerToNextQuizQuestionCommand({ accessToken, answer }));
  }

  @Get('pairs/my-current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async getActiveQuizGamePair(
    @ReqAccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiViewModel> {
    return this.quizGamePublicQueryRepositorySQL.getUserActiveQuizGame(
      accessToken,
    );
  }

  @Get('pairs/:quizGameId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async getQuizGameById(
    @Param('quizGameId') quizGameId: string,
    @ReqAccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiViewModel> {
    return this.quizGamePublicQueryRepositorySQL.getQuizGameById({
      accessToken,
      quizGameId,
    });
  }

  @Get('pairs/my')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async getAllMyQuizGamesWithPagination(
    @ReqAccessToken() accessToken: string | null,
    @Query() quizGameRawPaginationQuery: QuizGamePublicApiPaginationQueryDTO,
  ): Promise<QuizGamePublicApiPaginationViewModel> {
    const paginationQuery: QuizGamePublicApiPaginationQueryDTO = {
      sortBy: quizGameRawPaginationQuery.sortBy ?? 'pairCreatedDate',
      sortDirection: quizGameRawPaginationQuery.sortDirection ?? 'desc',
      pageNumber: quizGameRawPaginationQuery.pageNumber ?? 1,
      pageSize: quizGameRawPaginationQuery.pageSize ?? 10,
    };
    return this.quizGamePublicQueryRepositorySQL.getQuizGamesWithPagination({
      accessToken,
      paginationQuery,
    });
  }

  @Get('users/my-statistic')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async getMyQuizGamesStatistic(
    @ReqAccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiUserStatisticViewModel> {
    return this.quizGamePublicQueryRepositorySQL.getQuizGamesUserStatistic(
      accessToken,
    );
  }
}
