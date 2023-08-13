import { UpdateQuizGameQuestionAdminApiDTO } from '../../api/models/quiz-game-admin-api.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdminQuizGameQueryRepositorySQL } from '../../infrastructure/repositories/quiz-game-admin.query-repository';
import { AdminQuizGameRepositorySQL } from '../../infrastructure/repositories/quiz-game-admin.repository-sql';
import { QuizGameAdminApiViewModel } from '../../api/models/quiz-game-admin-api.models';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';

export class UpdateQuizGameQuestionCommand {
  constructor(
    public readonly data: Partial<UpdateQuizGameQuestionAdminApiDTO> & {
      questionId: string;
    },
  ) {}
}

@CommandHandler(UpdateQuizGameQuestionCommand)
export class UpdateQuizGameQuestionUseCase
  implements ICommandHandler<UpdateQuizGameQuestionCommand, void>
{
  constructor(
    private readonly quizGameQueryRepositorySQL: AdminQuizGameQueryRepositorySQL,
    private readonly quizGameRepositorySQL: AdminQuizGameRepositorySQL,
  ) {}

  async execute({
    data: { questionId, body, correctAnswers },
  }: UpdateQuizGameQuestionCommand): Promise<void> {
    if (!Number(questionId)) throw new NotFoundException();
    const foundedQuestion: QuizGameAdminApiViewModel | null =
      await this.quizGameQueryRepositorySQL.getQuestionById(questionId);
    if (!foundedQuestion) throw new NotFoundException();
    if (
      (correctAnswers ? correctAnswers.length < 1 : true) &&
      foundedQuestion.published
    ) {
      throw new BadRequestException(
        exceptionFactoryFunction(['correctAnswers']),
      );
    }
    await this.quizGameRepositorySQL.updateQuestion({
      questionId,
      body,
      correctAnswers,
    });
  }
}
