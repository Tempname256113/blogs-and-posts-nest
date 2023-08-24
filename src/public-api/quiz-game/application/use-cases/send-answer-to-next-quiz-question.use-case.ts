import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGamePublicApiPlayerAnswerViewModel } from '../../api/models/quiz-game-public-api.models';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizGamePairSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair.entity';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGamePairAnswerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-answer.entity';
import { QuizGamePairQuestionsSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-questions.entity';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';

export class SendAnswerToNextQuizQuestionCommand {
  constructor(public readonly data: { accessToken: string; answer: string }) {}
}

@CommandHandler(SendAnswerToNextQuizQuestionCommand)
export class SendAnswerToNextQuizQuestionUseCase
  implements
    ICommandHandler<
      SendAnswerToNextQuizQuestionCommand,
      QuizGamePublicApiPlayerAnswerViewModel
    >
{
  constructor(
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(QuizGamePairSQLEntity)
    private readonly quizGamePairEntity: Repository<QuizGamePairSQLEntity>,
    @InjectRepository(QuizGamePairAnswerSQLEntity)
    private readonly quizGamePairAnswerEntity: Repository<QuizGamePairAnswerSQLEntity>,
    @InjectRepository(QuizGamePairQuestionsSQLEntity)
    private readonly quizGamePairQuestionsEntity: Repository<QuizGamePairQuestionsSQLEntity>,
  ) {}

  async execute({
    data: { accessToken, answer },
  }: SendAnswerToNextQuizQuestionCommand): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId: string = accessTokenPayload.userId;
    const foundedQuizGamePair: QuizGamePairSQLEntity =
      await this.getQuizPairWithCurrentUser(userId);
    return this.sendAnswerToNextQuestion({
      userId,
      answer,
      quizPair: foundedQuizGamePair,
    });
  }

  async getQuizPairWithCurrentUser(
    userId: string,
  ): Promise<QuizGamePairSQLEntity> {
    const foundedGameWithCurrentUser: QuizGamePairSQLEntity | null =
      await this.quizGamePairEntity.findOne({
        where: [
          { player1Id: Number(userId), status: 'Active' },
          { player2Id: Number(userId), status: 'Active' },
        ],
        relations: ['questions'],
      });
    if (!foundedGameWithCurrentUser) {
      throw new ForbiddenException();
    }
    return foundedGameWithCurrentUser;
  }

  async sendAnswerToNextQuestion({
    userId,
    quizPair,
    answer,
  }: {
    userId: string;
    quizPair: QuizGamePairSQLEntity;
    answer: string;
  }): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const userAnswers: QuizGamePairAnswerSQLEntity[] =
      await this.quizGamePairAnswerEntity.findBy({
        userId: Number(userId),
        quizGamePairId: quizPair.id,
      });
    const allQuestions: QuizGameQuestionSQLEntity[] = quizPair.questions;
    const questionsWithPosition: QuizGamePairQuestionsSQLEntity[] =
      await this.quizGamePairQuestionsEntity.findBy({
        quizGamePairId: quizPair.id,
      });
    this.checkUserAnswersCount({
      userAnswers,
      allQuestions,
    });
    if (userAnswers.length === 0) {
      const questionWithPosition: QuizGamePairQuestionsSQLEntity =
        questionsWithPosition.find((question) => {
          return question.questionPosition === 0;
        });
      const question: QuizGameQuestionSQLEntity = allQuestions.find(
        (question) => {
          return question.id === questionWithPosition.questionId;
        },
      );
      return this.sendAnswer({
        userId: Number(userId),
        quizGamePairId: quizPair.id,
        question,
        answer,
      });
    } else if (userAnswers.length > 0) {
      const questionsIdWithAnswers: number[] = userAnswers.map((answer) => {
        return answer.questionId;
      });
      const questionsWithoutAnswers: QuizGamePairQuestionsSQLEntity[] =
        questionsWithPosition.filter((question) => {
          return !questionsIdWithAnswers.includes(question.questionId);
        });
      const questionPosition: number = Math.min(
        ...questionsWithoutAnswers.map((question) => {
          return question.questionPosition;
        }),
      );
      const questionId: number = questionsWithPosition.find((question) => {
        return question.questionPosition === questionPosition;
      }).questionId;
      const question: QuizGameQuestionSQLEntity = allQuestions.find(
        (question) => {
          return question.id === questionId;
        },
      );
      return this.sendAnswer({
        userId: Number(userId),
        quizGamePairId: quizPair.id,
        question,
        answer,
      });
    }
  }

  checkUserAnswersCount({
    userAnswers,
    allQuestions,
  }: {
    userAnswers: QuizGamePairAnswerSQLEntity[];
    allQuestions: QuizGameQuestionSQLEntity[];
  }): void {
    if (allQuestions.length === userAnswers.length) {
      throw new ForbiddenException();
    }
  }

  async sendAnswer({
    userId,
    quizGamePairId,
    question,
    answer,
  }: {
    userId: number;
    quizGamePairId: number;
    question: QuizGameQuestionSQLEntity;
    answer: string;
  }): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const answerStatus: boolean = question.answers.includes(answer);
    const newAnswer: QuizGamePairAnswerSQLEntity =
      new QuizGamePairAnswerSQLEntity();
    newAnswer.quizGamePairId = quizGamePairId;
    newAnswer.userId = userId;
    newAnswer.questionId = question.id;
    newAnswer.addedAt = new Date().toISOString();
    if (answerStatus) {
      newAnswer.answerStatus = 'Correct';
    } else {
      newAnswer.answerStatus = 'Incorrect';
    }
    await this.quizGamePairAnswerEntity.save(newAnswer);
    return {
      questionId: String(newAnswer.questionId),
      answerStatus: newAnswer.answerStatus,
      addedAt: newAnswer.addedAt,
    };
  }
}
