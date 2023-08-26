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
    const {
      quizGamePair: foundedQuizGamePair,
      playerPosition,
    }: Awaited<ReturnType<typeof this.getQuizPairWithCurrentUser>> =
      await this.getQuizPairWithCurrentUser(userId);
    return this.sendAnswerToNextQuestion({
      userId: Number(userId),
      answer,
      quizPair: foundedQuizGamePair,
      playerPosition,
    });
  }

  async getQuizPairWithCurrentUser(
    userId: string,
  ): Promise<{ quizGamePair: QuizGamePairSQLEntity; playerPosition: 1 | 2 }> {
    const foundedGameWithCurrentUser: QuizGamePairSQLEntity | null =
      await this.quizGamePairEntity.findOne({
        where: [
          { player1Id: Number(userId), status: 'Active' },
          { player2Id: Number(userId), status: 'Active' },
        ],
        relations: ['questions', 'answers'],
      });
    const playerPosition: 1 | 2 =
      foundedGameWithCurrentUser.player1Id === Number(userId) ? 1 : 2;
    if (!foundedGameWithCurrentUser) {
      throw new ForbiddenException();
    }
    return { quizGamePair: foundedGameWithCurrentUser, playerPosition };
  }

  async sendAnswerToNextQuestion({
    userId,
    quizPair,
    playerPosition,
    answer,
  }: {
    userId: number;
    quizPair: QuizGamePairSQLEntity;
    playerPosition: 1 | 2;
    answer: string;
  }): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const currentUserAnswers: QuizGamePairAnswerSQLEntity[] =
      quizPair.answers.filter((answer) => {
        return answer.userId === userId;
      });
    const allQuestions: QuizGameQuestionSQLEntity[] = quizPair.questions;
    const questionsWithPositions: QuizGamePairQuestionsSQLEntity[] =
      await this.quizGamePairQuestionsEntity.findBy({
        quizGamePairId: quizPair.id,
      });
    this.checkCurrentUserAnswersCount({
      userAnswers: currentUserAnswers,
      allQuestions,
    });
    const sendAnswer = async (
      question: QuizGameQuestionSQLEntity,
    ): Promise<QuizGamePublicApiPlayerAnswerViewModel> => {
      const increasePlayerScore = (): void => {
        const getPlayerAnswers = (
          playerPosition: 1 | 2,
        ): QuizGamePairAnswerSQLEntity[] => {
          const userId: number =
            playerPosition === 1 ? quizPair.player1Id : quizPair.player2Id;
          const userAnswers: QuizGamePairAnswerSQLEntity[] =
            quizPair.answers.filter((answer) => {
              return answer.userId === userId;
            });
          return userAnswers;
        };
        const playersAnswers: {
          firstPlayerAnswers: QuizGamePairAnswerSQLEntity[];
          secondPlayerAnswers: QuizGamePairAnswerSQLEntity[];
        } = {
          firstPlayerAnswers: getPlayerAnswers(1),
          secondPlayerAnswers: getPlayerAnswers(2),
        };
        if (playerPosition === 1) {
          quizPair.player1Score += 1;
          const { firstPlayerAnswers, secondPlayerAnswers } = playersAnswers;
          // если новый ответ является последним для первого игрока
          if (firstPlayerAnswers.length + 1 === allQuestions.length) {
            // если оппонент уже ответил на все вопросы первым
            if (secondPlayerAnswers.length === allQuestions.length) {
              const foundedCorrectAnswer:
                | QuizGamePairAnswerSQLEntity
                | undefined = secondPlayerAnswers.find((answer) => {
                return answer.answerStatus === 'Correct';
              });
              if (foundedCorrectAnswer) {
                quizPair.player2Score += 1;
              }
            }
          }
        } else if (playerPosition === 2) {
          quizPair.player2Score += 1;
          const { firstPlayerAnswers, secondPlayerAnswers } = playersAnswers;
          // если новый ответ является последним для второго игрока
          if (secondPlayerAnswers.length + 1 === allQuestions.length) {
            // если оппонент уже ответил на все вопросы первым
            if (firstPlayerAnswers.length === allQuestions.length) {
              const foundedCorrectAnswer:
                | QuizGamePairAnswerSQLEntity
                | undefined = firstPlayerAnswers.find((answer) => {
                return answer.answerStatus === 'Correct';
              });
              if (foundedCorrectAnswer) {
                quizPair.player1Score += 1;
              }
            }
          }
        }
      };
      const answerStatus: boolean = question.answers.includes(answer);
      const newAnswer: QuizGamePairAnswerSQLEntity =
        new QuizGamePairAnswerSQLEntity();
      newAnswer.quizGamePairId = quizPair.id;
      newAnswer.userId = userId;
      newAnswer.questionId = question.id;
      newAnswer.addedAt = new Date().toISOString();
      if (answerStatus) {
        newAnswer.answerStatus = 'Correct';
        increasePlayerScore();
      } else {
        newAnswer.answerStatus = 'Incorrect';
      }
      await this.quizGamePairAnswerEntity.save(newAnswer);
      await this.quizGamePairEntity.save(quizPair);
      return {
        questionId: String(newAnswer.questionId),
        answerStatus: newAnswer.answerStatus,
        addedAt: newAnswer.addedAt,
      };
    };
    if (currentUserAnswers.length === 0) {
      const questionWithPosition: QuizGamePairQuestionsSQLEntity =
        questionsWithPositions.find((question) => {
          return question.questionPosition === 0;
        });
      const question: QuizGameQuestionSQLEntity = allQuestions.find(
        (question) => {
          return question.id === questionWithPosition.questionId;
        },
      );
      return sendAnswer(question);
    } else if (currentUserAnswers.length > 0) {
      const questionsIdWithAnswers: number[] = currentUserAnswers.map(
        (answer) => {
          return answer.questionId;
        },
      );
      const questionsWithoutAnswers: QuizGamePairQuestionsSQLEntity[] =
        questionsWithPositions.filter((question) => {
          return !questionsIdWithAnswers.includes(question.questionId);
        });
      const questionPosition: number = Math.min(
        ...questionsWithoutAnswers.map((question) => {
          return question.questionPosition;
        }),
      );
      const questionId: number = questionsWithPositions.find((question) => {
        return question.questionPosition === questionPosition;
      }).questionId;
      const question: QuizGameQuestionSQLEntity = allQuestions.find(
        (question) => {
          return question.id === questionId;
        },
      );
      return sendAnswer(question);
    }
  }

  checkCurrentUserAnswersCount({
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
}
