import { CreateQuizGameQuestionAdminApiDTO } from '../../api/models/quiz-game-admin-api.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGameAdminApiViewModel } from '../../api/models/quiz-game-admin-api.models';
import { AdminQuizGameRepositorySQL } from '../../infrastructure/repositories/quiz-game-admin.repository-sql';

export class CreateQuestionCommand {
  constructor(public readonly data: CreateQuizGameQuestionAdminApiDTO) {}
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionUseCase
  implements
    ICommandHandler<CreateQuestionCommand, CreateQuizGameQuestionAdminApiDTO>
{
  constructor(
    private readonly quizGameRepositorySQL: AdminQuizGameRepositorySQL,
  ) {}
  async execute({
    data,
  }: CreateQuestionCommand): Promise<QuizGameAdminApiViewModel> {
    return this.quizGameRepositorySQL.createQuestion(data);
  }
}
