import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { ReqAccessToken } from '../../../../generic-decorators/access-token.decorator';
import {
  QuizGamePublicApiPlayerAnswerViewModel,
  QuizGamePublicApiViewModel,
} from './models/quiz-game-public-api.models';
import { ConnectUserToQuizCommand } from '../application/use-cases/connect-user-to-quiz.use-case';
import { QuizGamePublicApiCreateAnswerDTO } from './models/quiz-game-public-api.dto';
import { SendAnswerToNextQuizQuestionCommand } from '../application/use-cases/send-answer-to-next-quiz-question.use-case';
import { PublicQuizGameQueryRepositorySQL } from '../infrastructure/repositories/quiz-game-public.query-repository-sql';

@Controller('pair-game-quiz/pairs')
export class QuizGamePublicController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly quizGamePublicQueryRepositorySQL: PublicQuizGameQueryRepositorySQL,
  ) {}

  @Post('connection')
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

  @Post('my-current/answers')
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

  @Get('my-current')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async getActivePair(
    @ReqAccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiViewModel> {
    return this.quizGamePublicQueryRepositorySQL.getUserActiveQuizGame(
      accessToken,
    );
  }
}
