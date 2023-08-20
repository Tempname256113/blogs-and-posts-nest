import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AccessTokenGuard } from '../../../../generic-guards/access-token.guard';
import { AccessToken } from '../../../../generic-decorators/access-token.decorator';
import { QuizGamePublicApiViewModel } from './models/quiz-game-public-api.models';
import { ConnectUserToQuizCommand } from '../application/use-cases/connect-user-to-quiz.use-case';

@Controller('pair-game-quiz/pairs')
export class QuizGamePublicController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('connection')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AccessTokenGuard)
  async connectUserToQuizGamePair(
    @AccessToken() accessToken: string | null,
  ): Promise<QuizGamePublicApiViewModel> {
    return this.commandBus.execute<
      ConnectUserToQuizCommand,
      QuizGamePublicApiViewModel
    >(new ConnectUserToQuizCommand({ accessToken }));
  }
}
