import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuizGamePublicApiPlayerAnswerViewModel } from '../../api/models/quiz-game-public-api.models';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizGamePairSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair.entity';
import { Repository } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGamePairAnswerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-answer.entity';
import { QuizGamePairQuestionWithPositionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-question-with-position.entity';
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
    @InjectRepository(QuizGamePairQuestionWithPositionSQLEntity)
    private readonly quizGamePairQuestionWithPositionEntity: Repository<QuizGamePairQuestionWithPositionSQLEntity>,
  ) {}

  async execute({
    data: { accessToken, answer },
  }: SendAnswerToNextQuizQuestionCommand): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId = Number(accessTokenPayload.userId);
    const {
      quizGamePair: foundedQuizGamePair,
      playerPosition,
    }: Awaited<ReturnType<typeof this.getQuizPairWithCurrentUser>> =
      await this.getQuizPairWithCurrentUser(userId);
    const currentUserAnswers: QuizGamePairAnswerSQLEntity[] =
      foundedQuizGamePair.answers.filter((answer) => {
        return answer.userId === userId;
      });
    await this.checkCurrentUserAnswersCount({
      currentUserAnswersQuantity: currentUserAnswers.length,
      allQuizGameQuestionsQuantity: foundedQuizGamePair.questions.length,
    });
    return this.sendAnswerToNextQuestion({
      userId,
      answer,
      quizPair: foundedQuizGamePair,
      currentPlayerPosition: playerPosition,
    });
  }

  async getQuizPairWithCurrentUser(
    userId: number,
  ): Promise<{ quizGamePair: QuizGamePairSQLEntity; playerPosition: 1 | 2 }> {
    const foundedGameWithCurrentUser: QuizGamePairSQLEntity | null =
      await this.quizGamePairEntity.findOne({
        where: [
          { player1Id: Number(userId), status: 'Active' },
          { player2Id: Number(userId), status: 'Active' },
        ],
        relations: ['questions', 'answers'],
      });
    if (!foundedGameWithCurrentUser) {
      throw new ForbiddenException();
    }
    const playerPosition: 1 | 2 =
      foundedGameWithCurrentUser.player1Id === Number(userId) ? 1 : 2;
    return { quizGamePair: foundedGameWithCurrentUser, playerPosition };
  }

  async sendAnswerToNextQuestion({
    userId,
    quizPair,
    currentPlayerPosition,
    answer,
  }: {
    userId: number;
    quizPair: QuizGamePairSQLEntity;
    currentPlayerPosition: 1 | 2;
    answer: string;
  }): Promise<QuizGamePublicApiPlayerAnswerViewModel> {
    const allQuestions: QuizGameQuestionSQLEntity[] = quizPair.questions;
    const sendAnswer = async (
      question: QuizGameQuestionSQLEntity,
    ): Promise<QuizGamePublicApiPlayerAnswerViewModel> => {
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
        player1: QuizGamePairAnswerSQLEntity[];
        player2: QuizGamePairAnswerSQLEntity[];
      } = {
        player1: getPlayerAnswers(1),
        player2: getPlayerAnswers(2),
      };
      const playersAnswersQuantity: {
        player1: number;
        player2: number;
      } = {
        player1: playersAnswers.player1.length,
        player2: playersAnswers.player2.length,
      };
      const opponentPlayerPosition: 1 | 2 = currentPlayerPosition === 1 ? 2 : 1;
      const currentPlayerProp = `player${currentPlayerPosition}`;
      const opponentPlayerProp = `player${opponentPlayerPosition}`;
      // прибавляется к количеству ответов текущего игрока 1 потому что сейчас запишется 1 ответ в базу данных
      playersAnswersQuantity[currentPlayerProp] += 1;
      // если новый ответ является последним для текущего игрока
      if (playersAnswersQuantity[currentPlayerProp] === allQuestions.length) {
        // если оппонент уже ответил на все вопросы первым
        if (
          playersAnswersQuantity[opponentPlayerProp] === allQuestions.length
        ) {
          // поиск хотя бы одного правильного ответа у уже ответившего на все вопросы оппонента
          // если хотя бы один правильный ответ будет найден то за то что оппонент ответил первым на все вопросы
          // ему добавляется 1 бонусный балл
          const foundedCorrectAnswer: QuizGamePairAnswerSQLEntity | undefined =
            playersAnswers[opponentPlayerProp].find((answer) => {
              return answer.answerStatus === 'Correct';
            });
          if (foundedCorrectAnswer) {
            quizPair[`player${opponentPlayerPosition}Score`] += 1;
          }
        }
      }
      if (
        playersAnswersQuantity.player1 === allQuestions.length &&
        playersAnswersQuantity.player2 === allQuestions.length
      ) {
        quizPair.status = 'Finished';
        quizPair.finishGameDate = new Date().toISOString();
      }
      // у question entity есть jsonb столбец с массивом правильных ответов на конкретный вопрос
      // если ответ игрока есть в этом массиве с ответами то игрок ответил верно. если нет то неверно
      const answerStatus: boolean = question.answers.includes(answer);
      const newAnswer: QuizGamePairAnswerSQLEntity =
        new QuizGamePairAnswerSQLEntity();
      newAnswer.quizGamePairId = quizPair.id;
      newAnswer.userId = userId;
      newAnswer.questionId = question.id;
      newAnswer.addedAt = new Date().toISOString();
      if (answerStatus) {
        newAnswer.answerStatus = 'Correct';
        if (currentPlayerPosition === 1) {
          quizPair.player1Score += 1;
        } else if (currentPlayerPosition === 2) {
          quizPair.player2Score += 1;
        }
      } else {
        newAnswer.answerStatus = 'Incorrect';
      }
      await this.quizGamePairEntity.save(quizPair);
      await this.quizGamePairAnswerEntity.save(newAnswer);
      return {
        questionId: String(newAnswer.questionId),
        answerStatus: newAnswer.answerStatus,
        addedAt: newAnswer.addedAt,
      };
    };
    const currentUserAnswers: QuizGamePairAnswerSQLEntity[] =
      quizPair.answers.filter((answer) => {
        return answer.userId === userId;
      });
    const questionsWithPositions: QuizGamePairQuestionWithPositionSQLEntity[] =
      await this.quizGamePairQuestionWithPositionEntity.findBy({
        quizGamePairId: quizPair.id,
      });
    // если игрок еще не ответил ни на один вопрос
    if (currentUserAnswers.length === 0) {
      const questionWithPosition: QuizGamePairQuestionWithPositionSQLEntity =
        questionsWithPositions.find((question) => {
          return question.questionPosition === 0;
        });
      const question: QuizGameQuestionSQLEntity = allQuestions.find(
        (question) => {
          return question.id === questionWithPosition.questionId;
        },
      );
      return sendAnswer(question);
      // если у игрока уже есть ответы на вопросы, но не на все
    } else if (currentUserAnswers.length > 0) {
      const questionsIdWithAnswers: number[] = currentUserAnswers.map(
        (answer) => {
          return answer.questionId;
        },
      );
      const questionsWithoutAnswers: QuizGamePairQuestionWithPositionSQLEntity[] =
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
    currentUserAnswersQuantity,
    allQuizGameQuestionsQuantity,
  }: {
    currentUserAnswersQuantity: number;
    allQuizGameQuestionsQuantity: number;
  }): void {
    if (allQuizGameQuestionsQuantity === currentUserAnswersQuantity) {
      throw new ForbiddenException();
    }
  }
}
