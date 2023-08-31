import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QuizGamePairSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair.entity';
import { Repository } from 'typeorm';
import { QuizGamePairQuestionsSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-questions.entity';
import {
  QuizGamePublicApiPlayerAnswerViewModel,
  QuizGamePublicApiQuestionViewModel,
  QuizGamePublicApiViewModel,
} from '../../api/models/quiz-game-public-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { validate } from 'uuid';

@Injectable()
export class PublicQuizGameQueryRepositorySQL {
  constructor(
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(QuizGamePairSQLEntity)
    private readonly quizGamePairEntity: Repository<QuizGamePairSQLEntity>,
    @InjectRepository(QuizGamePairQuestionsSQLEntity)
    private readonly quizGamePairQuestionsEntity: Repository<QuizGamePairQuestionsSQLEntity>,
  ) {}

  async getUserActiveQuizGame(
    accessToken: string,
  ): Promise<QuizGamePublicApiViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    const userId: string = accessTokenPayload.userId;
    const foundedQuizPair: QuizGamePairSQLEntity | null =
      await this.quizGamePairEntity.findOne({
        where: [
          { player1Id: Number(userId), status: 'PendingSecondPlayer' },
          { player1Id: Number(userId), status: 'Active' },
          { player2Id: Number(userId), status: 'Active' },
        ],
        relations: ['answers', 'questions', 'player1', 'player2'],
      });
    if (!foundedQuizPair) throw new NotFoundException();
    if (foundedQuizPair.status === 'PendingSecondPlayer') {
      return {
        id: String(foundedQuizPair.id),
        firstPlayerProgress: {
          player: {
            id: String(foundedQuizPair.player1.id),
            login: foundedQuizPair.player1.login,
          },
          score: 0,
          answers: [],
        },
        secondPlayerProgress: null,
        questions: null,
        status: foundedQuizPair.status,
        pairCreatedDate: foundedQuizPair.pairCreatedDate,
        startGameDate: null,
        finishGameDate: null,
      };
    }
    const quizPairQuestionsWithPositions: QuizGamePairQuestionsSQLEntity[] =
      await this.quizGamePairQuestionsEntity.findBy({
        quizGamePairId: foundedQuizPair.id,
      });
    const quizPairQuestionsWithCorrectPositions: QuizGamePublicApiQuestionViewModel[] =
      [];
    quizPairQuestionsWithPositions.forEach((questionWithPosition) => {
      const quizGameQuestion: QuizGameQuestionSQLEntity =
        foundedQuizPair.questions.find((question) => {
          return question.id === questionWithPosition.questionId;
        });
      quizPairQuestionsWithCorrectPositions[
        questionWithPosition.questionPosition
      ] = {
        id: String(quizGameQuestion.id),
        body: quizGameQuestion.body,
      };
    });
    const getPlayerAnswers = (
      playerPosition: 1 | 2,
    ): QuizGamePublicApiPlayerAnswerViewModel[] => {
      return foundedQuizPair.answers
        .filter((answer) => {
          return playerPosition === 1
            ? answer.userId === foundedQuizPair.player1Id
            : answer.userId === foundedQuizPair.player2Id;
        })
        .map((answer) => {
          return {
            questionId: String(answer.questionId),
            answerStatus: answer.answerStatus,
            addedAt: answer.addedAt,
          };
        });
    };
    const {
      firstPlayerAnswers,
      secondPlayerAnswers,
    }: {
      firstPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[];
      secondPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[];
    } = {
      firstPlayerAnswers: getPlayerAnswers(1),
      secondPlayerAnswers: getPlayerAnswers(2),
    };
    return {
      id: String(foundedQuizPair.id),
      firstPlayerProgress: {
        answers: firstPlayerAnswers,
        player: {
          id: String(foundedQuizPair.player1.id),
          login: foundedQuizPair.player1.login,
        },
        score: foundedQuizPair.player1Score,
      },
      secondPlayerProgress: {
        answers: secondPlayerAnswers,
        player: {
          id: String(foundedQuizPair.player2.id),
          login: foundedQuizPair.player2.login,
        },
        score: foundedQuizPair.player2Score,
      },
      questions: quizPairQuestionsWithCorrectPositions,
      status: foundedQuizPair.status,
      pairCreatedDate: foundedQuizPair.pairCreatedDate,
      startGameDate: foundedQuizPair.startGameDate,
      finishGameDate: foundedQuizPair.finishGameDate,
    };
  }

  async getQuizGameById({
    accessToken,
    quizGameId,
  }: {
    accessToken: string;
    quizGameId: string;
  }): Promise<QuizGamePublicApiViewModel> {
    if (!validate(quizGameId)) {
      throw new BadRequestException(exceptionFactoryFunction(['id']));
    }
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const foundedQuizGame: QuizGamePairSQLEntity | null =
      await this.quizGamePairEntity.findOne({
        where: { id: Number(quizGameId) },
        relations: ['player1', 'player2', 'questions', 'answers'],
      });
    if (!foundedQuizGame) {
      throw new NotFoundException();
    }
    if (
      foundedQuizGame.player1Id !== Number(userId) ||
      foundedQuizGame.player2Id !== Number(userId)
    ) {
      throw new ForbiddenException();
    }
    if (foundedQuizGame.status === 'PendingSecondPlayer') {
      return {
        id: String(foundedQuizGame.id),
        firstPlayerProgress: {
          answers: [],
          player: {
            id: String(foundedQuizGame.player1.id),
            login: foundedQuizGame.player1.login,
          },
          score: 0,
        },
        secondPlayerProgress: null,
        questions: null,
        status: foundedQuizGame.status,
        pairCreatedDate: foundedQuizGame.pairCreatedDate,
        startGameDate: null,
        finishGameDate: null,
      };
    }
    const allQuestionsWithPositions: QuizGamePairQuestionsSQLEntity[] =
      await this.quizGamePairQuestionsEntity.findBy({
        quizGamePairId: Number(quizGameId),
      });
    const quizGameQuestions: QuizGamePublicApiQuestionViewModel[] = [];
    allQuestionsWithPositions.forEach((questionWithPosition) => {
      const quizGameQuestion: QuizGameQuestionSQLEntity =
        foundedQuizGame.questions.find((question) => {
          return question.id === questionWithPosition.questionId;
        });
      quizGameQuestions[questionWithPosition.questionPosition] = {
        id: String(quizGameQuestion.id),
        body: quizGameQuestion.body,
      };
    });
    const getPlayerAnswers = (
      playerPosition: 1 | 2,
    ): QuizGamePublicApiPlayerAnswerViewModel[] => {
      return foundedQuizGame.answers
        .filter((answer) => {
          return playerPosition === 1
            ? answer.userId === foundedQuizGame.player1Id
            : answer.userId === foundedQuizGame.player2Id;
        })
        .map((answer) => {
          return {
            questionId: String(answer.questionId),
            answerStatus: answer.answerStatus,
            addedAt: answer.addedAt,
          };
        });
    };
    const {
      firstPlayerAnswers,
      secondPlayerAnswers,
    }: {
      firstPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[];
      secondPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[];
    } = {
      firstPlayerAnswers: getPlayerAnswers(1),
      secondPlayerAnswers: getPlayerAnswers(2),
    };
    return {
      id: String(foundedQuizGame.id),
      firstPlayerProgress: {
        answers: firstPlayerAnswers,
        player: {
          id: String(foundedQuizGame.player1.id),
          login: foundedQuizGame.player1.login,
        },
        score: foundedQuizGame.player1Score,
      },
      secondPlayerProgress: {
        answers: secondPlayerAnswers,
        player: {
          id: String(foundedQuizGame.player2.id),
          login: foundedQuizGame.player2.login,
        },
        score: foundedQuizGame.player2Score,
      },
      questions: quizGameQuestions,
      status: foundedQuizGame.status,
      pairCreatedDate: foundedQuizGame.pairCreatedDate,
      startGameDate: foundedQuizGame.startGameDate,
      finishGameDate: foundedQuizGame.finishGameDate,
    };
  }
}
