import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { QuizGamePairSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair.entity';
import {
  DataSource,
  FindOptionsOrder,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { QuizGamePairQuestionsSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-questions.entity';
import {
  QuizGamePublicApiPaginationViewModel,
  QuizGamePublicApiPlayerAnswerViewModel,
  QuizGamePublicApiQuestionViewModel,
  QuizGamePublicApiUserStatisticViewModel,
  QuizGamePublicApiViewModel,
} from '../../api/models/quiz-game-public-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { validate } from 'uuid';
import { QuizGamePublicApiPaginationQueryDTO } from '../../api/models/quiz-game-public-api.dto';
import { QuizGamePairAnswerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-answer.entity';

@Injectable()
export class PublicQuizGameQueryRepositorySQL {
  constructor(
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(QuizGamePairSQLEntity)
    private readonly quizGamePairEntity: Repository<QuizGamePairSQLEntity>,
    @InjectRepository(QuizGamePairQuestionsSQLEntity)
    private readonly quizGamePairQuestionsEntity: Repository<QuizGamePairQuestionsSQLEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
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
        where: { id: quizGameId },
        relations: ['player1', 'player2', 'questions', 'answers'],
      });
    if (!foundedQuizGame) {
      throw new NotFoundException();
    }
    if (
      foundedQuizGame.player1Id !== Number(userId) &&
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
        quizGamePairId: quizGameId,
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

  async getQuizGamesWithPagination({
    accessToken,
    paginationQuery,
  }: {
    accessToken: string;
    paginationQuery: QuizGamePublicApiPaginationQueryDTO;
  }): Promise<QuizGamePublicApiPaginationViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const correctOrder: FindOptionsOrder<QuizGamePairSQLEntity> =
      paginationQuery.sortBy === 'status'
        ? { status: paginationQuery.sortDirection, pairCreatedDate: 'desc' }
        : { [paginationQuery.sortBy]: paginationQuery.sortDirection };
    const howMuchToSkip: number =
      (paginationQuery.pageNumber - 1) * paginationQuery.pageSize;
    const foundedQuizGames: QuizGamePairSQLEntity[] =
      await this.quizGamePairEntity.find({
        where: [{ player1Id: Number(userId) }, { player2Id: Number(userId) }],
        relations: ['player1', 'player2', 'questions', 'answers'],
        order: correctOrder,
        skip: howMuchToSkip,
        take: paginationQuery.pageSize,
      });
    // const foundedGamesIds: string[] = foundedQuizGames.map((quizGame) => {
    //   return quizGame.id;
    // });
    // const questionsWithPositions: QuizGamePairQuestionsSQLEntity[] =
    //   await this.quizGamePairQuestionsEntity.findBy({
    //     quizGamePairId: In(foundedGamesIds),
    //   });
    const totalCount: number = foundedQuizGames.length;
    const pagesCount: number = Math.ceil(totalCount / paginationQuery.pageSize);
    const mappedQuizGames: QuizGamePublicApiViewModel[] = foundedQuizGames.map(
      (quizGame) => {
        if (quizGame.status === 'PendingSecondPlayer') {
          return {
            id: quizGame.id,
            firstPlayerProgress: {
              answers: [],
              player: {
                id: String(quizGame.player1.id),
                login: quizGame.player1.login,
              },
              score: quizGame.player1Score,
            },
            secondPlayerProgress: null,
            questions: null,
            status: quizGame.status,
            pairCreatedDate: quizGame.pairCreatedDate,
            startGameDate: null,
            finishGameDate: null,
          };
        }
        const firstPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[] =
          quizGame.answers
            .filter((answer) => {
              return answer.userId === quizGame.player1Id;
            })
            .map((answer) => {
              return {
                questionId: String(answer.questionId),
                answerStatus: answer.answerStatus,
                addedAt: answer.addedAt,
              };
            });
        const secondPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[] =
          quizGame.answers
            .filter((answer) => {
              return answer.userId === quizGame.player2Id;
            })
            .map((answer) => {
              return {
                questionId: String(answer.questionId),
                answerStatus: answer.answerStatus,
                addedAt: answer.addedAt,
              };
            });
        // const quizGameQuestionsWithPositions: QuizGamePairQuestionsSQLEntity[] =
        //   questionsWithPositions.filter((question) => {
        //     return question.quizGamePairId === quizGame.id;
        //   });
        // const questions: QuizGameQuestionSQLEntity[] = [];
        // quizGameQuestionsWithPositions.forEach((questionWithPosition) => {
        //   const foundedQuestion: QuizGameQuestionSQLEntity =
        //     quizGame.questions.find((question) => {
        //       return question.id === questionWithPosition.questionId;
        //     });
        //   questions[questionWithPosition.questionPosition] = foundedQuestion;
        // });
        const mappedQuestions: QuizGamePublicApiQuestionViewModel[] =
          quizGame.questions.map((question) => {
            return {
              id: String(question.id),
              body: question.body,
            };
          });
        return {
          id: quizGame.id,
          firstPlayerProgress: {
            answers: firstPlayerAnswers,
            player: {
              id: String(quizGame.player1.id),
              login: quizGame.player1.login,
            },
            score: quizGame.player1Score,
          },
          secondPlayerProgress: {
            answers: secondPlayerAnswers,
            player: {
              id: String(quizGame.player2.id),
              login: quizGame.player2.login,
            },
            score: quizGame.player2Score,
          },
          questions: mappedQuestions,
          status: quizGame.status,
          pairCreatedDate: quizGame.pairCreatedDate,
          startGameDate: quizGame.startGameDate,
          finishGameDate: quizGame.finishGameDate,
        };
      },
    );
    return {
      pagesCount,
      page: paginationQuery.pageNumber,
      pageSize: paginationQuery.pageSize,
      totalCount,
      items: mappedQuizGames,
    };
  }

  async getQuizGamesUserStatistic(
    accessToken: string,
  ): Promise<QuizGamePublicApiUserStatisticViewModel> {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    const userId: string = accessTokenPayload.userId;
    const queryBuilder: SelectQueryBuilder<QuizGamePairSQLEntity> =
      await this.dataSource.createQueryBuilder(QuizGamePairSQLEntity, 'q');
    const getSumScore = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (
        qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
      ): SelectQueryBuilder<QuizGamePairSQLEntity> => {
        return qb
          .select(`SUM(q.player${playerPosition}Score)`)
          .from(QuizGamePairSQLEntity, 'q')
          .where(`q.player${playerPosition}Id = :playerId`, {
            playerId: Number(userId),
          });
      };
    };
    const getWinsCount = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (qb: SelectQueryBuilder<QuizGamePairSQLEntity>) => {
        const opponentPosition: 1 | 2 = playerPosition === 1 ? 2 : 1;
        return qb
          .select('COUNT(*)')
          .from(QuizGamePairSQLEntity, 'q')
          .where(
            `q.player${playerPosition}Id = :playerId AND q.player${playerPosition}Score > q.player${opponentPosition}Score`,
            {
              playerId: Number(userId),
            },
          );
      };
    };
    const getLossesCount = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (qb: SelectQueryBuilder<QuizGamePairSQLEntity>) => {
        const opponentPosition: 1 | 2 = playerPosition === 1 ? 2 : 1;
        return qb
          .select('COUNT(*)')
          .from(QuizGamePairSQLEntity, 'q')
          .where(
            `q.player${playerPosition}Id = :playerId AND q.player${playerPosition}Score < q.player${opponentPosition}Score`,
            {
              playerId: Number(userId),
            },
          );
      };
    };
    const getDrawsCount = (
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ): SelectQueryBuilder<QuizGamePairSQLEntity> => {
      return qb
        .select('COUNT(*)')
        .from(QuizGamePairSQLEntity, 'q')
        .where(
          '(q.player1Id = :playerId OR q.player2Id = :playerId) AND (q.player1Score = q.player2Score)',
          {
            playerId: Number(userId),
          },
        );
    };
    const result: {
      gamesCount: string;
      sumScoreByP1: string;
      sumScoreByP2: string;
      winsCountByP1: string;
      winsCountByP2: string;
      lossesCountByP1: string;
      lossesCountByP2: string;
      drawsCount: string;
    } = await queryBuilder
      .select('COUNT(*) "gamesCount"')
      .where('q.player1Id = :playerId OR q.player2Id = :playerId', {
        playerId: Number(userId),
      })
      .addSelect(getSumScore(1), 'sumScoreByP1')
      .addSelect(getSumScore(2), 'sumScoreByP2')
      .addSelect(getWinsCount(1), 'winsCountByP1')
      .addSelect(getWinsCount(2), 'winsCountByP2')
      .addSelect(getLossesCount(1), 'lossesCountByP1')
      .addSelect(getLossesCount(2), 'lossesCountByP2')
      .addSelect(getDrawsCount, 'drawsCount')
      .getRawOne();
    const sumScore: number =
      Number(result.sumScoreByP1) + Number(result.sumScoreByP2);
    const gamesCount = Number(result.gamesCount);
    const rawAvgScores: string = (sumScore / gamesCount).toFixed(2);
    let avgScores: number;
    if (
      rawAvgScores.substring(rawAvgScores.length - 2, rawAvgScores.length) ===
      '00'
    ) {
      avgScores = Math.round(Number(rawAvgScores));
    } else {
      avgScores = Number(rawAvgScores);
    }
    return {
      sumScore,
      avgScores,
      gamesCount,
      winsCount: Number(result.winsCountByP1) + Number(result.winsCountByP2),
      lossesCount:
        Number(result.lossesCountByP1) + Number(result.lossesCountByP2),
      drawsCount: Number(result.drawsCount),
    };
  }
}
