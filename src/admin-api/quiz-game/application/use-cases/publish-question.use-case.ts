import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdminQuizGameRepositorySQL } from '../../infrastructure/repositories/quiz-game-admin.repository-sql';
import { NotFoundException } from '@nestjs/common';

export class PublishQuizGameQuestionCommand {
  constructor(
    public readonly data: {
      questionId: string;
      publishQuestionStatus: boolean;
    },
  ) {}
}

@CommandHandler(PublishQuizGameQuestionCommand)
export class PublishQuizGameQuestionUseCase
  implements ICommandHandler<PublishQuizGameQuestionCommand, void>
{
  constructor(
    private readonly quizGameRepositorySQL: AdminQuizGameRepositorySQL,
  ) {}

  async execute({
    data: { questionId, publishQuestionStatus },
  }: PublishQuizGameQuestionCommand): Promise<void> {
    const updateResult: boolean =
      await this.quizGameRepositorySQL.publishQuestion({
        questionId,
        publish: publishQuestionStatus,
      });
    if (!updateResult) throw new NotFoundException();
  }
}
