import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AdminQuizGameRepositorySQL } from '../../infrastructure/repositories/quiz-game-admin.repository-sql';
import { NotFoundException } from '@nestjs/common';

export class DeleteQuizGameQuestionCommand {
  constructor(public readonly questionId: string) {}
}

@CommandHandler(DeleteQuizGameQuestionCommand)
export class DeleteQuizGameQuestionUseCase
  implements ICommandHandler<DeleteQuizGameQuestionCommand, void>
{
  constructor(
    private readonly quizGameRepositorySQL: AdminQuizGameRepositorySQL,
  ) {}

  async execute({ questionId }: DeleteQuizGameQuestionCommand): Promise<void> {
    if (!Number(questionId)) throw new NotFoundException();
    const deleteQuizQuestionStatus: boolean =
      await this.quizGameRepositorySQL.deleteQuestion(questionId);
    if (!deleteQuizQuestionStatus) throw new NotFoundException();
  }
}
