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
import { QuizGamePairQuestionWithPositionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-question-with-position.entity';
import {
  QuizGamePublicApiPaginationViewModel,
  QuizGamePublicApiPlayerAnswerViewModel,
  QuizGamePublicApiQuestionViewModel,
  QuizGamePublicApiUserStatisticViewModel,
  QuizGamePublicApiUsersTopPaginationViewModel,
  QuizGamePublicApiUsersTopViewModel,
  QuizGamePublicApiViewModel,
} from '../../api/models/quiz-game-public-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { exceptionFactoryFunction } from '../../../../../generic-factory-functions/exception-factory.function';
import { validate } from 'uuid';
import {
  QuizGamePublicApiPaginationQueryDTO,
  QuizGamePublicApiUsersTopQueryDTO,
} from '../../api/models/quiz-game-public-api.dto';
import { UserSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/user-sql.entity';

@Injectable()
export class PublicQuizGameQueryRepositorySQL {
  constructor(
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(QuizGamePairSQLEntity)
    private readonly quizGamePairEntity: Repository<QuizGamePairSQLEntity>,
    @InjectRepository(QuizGamePairQuestionWithPositionSQLEntity)
    private readonly quizGamePairQuestionsEntity: Repository<QuizGamePairQuestionWithPositionSQLEntity>,
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
    const quizPairQuestionsWithPositions: QuizGamePairQuestionWithPositionSQLEntity[] =
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
    const allQuestionsWithPositions: QuizGamePairQuestionWithPositionSQLEntity[] =
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
    const foundedGamesIds: string[] = foundedQuizGames.map((quizGame) => {
      return quizGame.id;
    });
    const questionsWithPositions: QuizGamePairQuestionWithPositionSQLEntity[] =
      await this.quizGamePairQuestionsEntity.findBy({
        quizGamePairId: In(foundedGamesIds),
      });
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
            })
            .sort((a, b) => {
              if (a.addedAt < b.addedAt) return -1;
              if (a.addedAt > b.addedAt) return 1;
              return 0;
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
            })
            .sort((a, b) => {
              if (a.addedAt < b.addedAt) return -1;
              if (a.addedAt > b.addedAt) return 1;
              return 0;
            });
        const quizGameQuestionsWithPositions: QuizGamePairQuestionWithPositionSQLEntity[] =
          questionsWithPositions.filter((question) => {
            return question.quizGamePairId === quizGame.id;
          });
        const questions: QuizGameQuestionSQLEntity[] = [];
        quizGameQuestionsWithPositions.forEach((questionWithPosition) => {
          const foundedQuestion: QuizGameQuestionSQLEntity =
            quizGame.questions.find((question) => {
              return question.id === questionWithPosition.questionId;
            });
          questions[questionWithPosition.questionPosition] = foundedQuestion;
        });
        const mappedQuestions: QuizGamePublicApiQuestionViewModel[] =
          questions.map((question) => {
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

  async getUsersTop(
    paginationQuery: QuizGamePublicApiUsersTopQueryDTO,
  ): Promise<QuizGamePublicApiUsersTopPaginationViewModel> {
    const getWinsCount = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (
        qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
      ): SelectQueryBuilder<QuizGamePairSQLEntity> => {
        const opponentPosition: 1 | 2 = playerPosition === 1 ? 2 : 1;
        return qb
          .select('COUNT(*)')
          .from(QuizGamePairSQLEntity, 'q1')
          .where(
            `(q1.player${playerPosition}Id = q.player${playerPosition}Id) AND (q1.player${playerPosition}Score > q1.player${opponentPosition}Score)`,
          );
      };
    };
    const getLossesCount = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (
        qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
      ): SelectQueryBuilder<QuizGamePairSQLEntity> => {
        const opponentPosition: 1 | 2 = playerPosition === 1 ? 2 : 1;
        return qb
          .select('COUNT(*)')
          .from(QuizGamePairSQLEntity, 'q1')
          .where(
            `(q1.player${playerPosition}Id = q.player${playerPosition}Id) AND (q1.player${playerPosition}Score < q1.player${opponentPosition}Score)`,
          );
      };
    };
    const getDrawsCount = (
      playerPosition: 1 | 2,
    ): ((
      qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
    ) => SelectQueryBuilder<QuizGamePairSQLEntity>) => {
      return (
        qb: SelectQueryBuilder<QuizGamePairSQLEntity>,
      ): SelectQueryBuilder<QuizGamePairSQLEntity> => {
        const opponentPosition: 1 | 2 = playerPosition === 1 ? 2 : 1;
        return qb
          .select('COUNT(*)')
          .from(QuizGamePairSQLEntity, 'q1')
          .where(
            `(q1.player${playerPosition}Id = q.player${playerPosition}Id) AND (q1.player${playerPosition}Score = q1.player${opponentPosition}Score)`,
          );
      };
    };
    const getResult = async <T extends 1 | 2>(
      pPos: 1 | 2,
    ): Promise<
      T extends 1
        ? {
            p1GamesCount: string;
            p1Id: number;
            p1Login: string;
            p1SumScore: string;
            p1WinsCount: string;
            p1LossesCount: string;
            p1DrawsCount: string;
          }[]
        : {
            p2GamesCount: string;
            p2Id: number;
            p2Login: string;
            p2SumScore: string;
            p2WinsCount: string;
            p2LossesCount: string;
            p2DrawsCount: string;
          }[]
    > => {
      const queryBuilder: SelectQueryBuilder<QuizGamePairSQLEntity> =
        await this.dataSource.createQueryBuilder(QuizGamePairSQLEntity, 'q');
      return queryBuilder
        .select(
          `COUNT(*) as "p${pPos}GamesCount",
         q.player${pPos}Id as "p${pPos}Id",
         u.login as "p${pPos}Login",
         SUM(q.player${pPos}Score) as "p${pPos}SumScore"`,
        )
        .addSelect(getWinsCount(pPos), `p${pPos}WinsCount`)
        .addSelect(getLossesCount(pPos), `p${pPos}LossesCount`)
        .addSelect(getDrawsCount(pPos), `p${pPos}DrawsCount`)
        .innerJoin(UserSQLEntity, 'u', `q.player${pPos}Id = u.id`)
        .groupBy(`q.player${pPos}Id, u.login`)
        .getRawMany();
    };
    type RawPlayerStatisticType = {
      pGamesCount: number;
      pId: number;
      pLogin: string;
      pSumScore: number;
      pWinsCount: number;
      pLossesCount: number;
      pDrawsCount: number;
    };
    const mergeResults = async (): Promise<RawPlayerStatisticType[]> => {
      const player1Result: Awaited<ReturnType<typeof getResult>> =
        await getResult<1>(1);
      const player2Result: Awaited<ReturnType<typeof getResult>> =
        await getResult<2>(2);
      const resultArray: RawPlayerStatisticType[] = [];
      player1Result.forEach((p1Result, p1ArrIndex) => {
        const firstPlayerStatistic: RawPlayerStatisticType = {
          pGamesCount: Number(p1Result.p1GamesCount),
          pId: p1Result.p1Id,
          pLogin: p1Result.p1Login,
          pSumScore: Number(p1Result.p1SumScore),
          pWinsCount: Number(p1Result.p1WinsCount),
          pLossesCount: Number(p1Result.p1LossesCount),
          pDrawsCount: Number(p1Result.p1DrawsCount),
        };
        player2Result.forEach((p2Result, p2ArrIndex) => {
          if (p2Result?.p2Id === p1Result.p1Id) {
            firstPlayerStatistic.pGamesCount += Number(p2Result.p2GamesCount);
            firstPlayerStatistic.pSumScore += Number(p2Result.p2SumScore);
            firstPlayerStatistic.pWinsCount += Number(p2Result.p2WinsCount);
            firstPlayerStatistic.pLossesCount += Number(p2Result.p2LossesCount);
            firstPlayerStatistic.pDrawsCount += Number(p2Result.p2DrawsCount);
            delete player2Result[p2ArrIndex];
          }
        });
        resultArray.push(firstPlayerStatistic);
        delete player1Result[p1ArrIndex];
      });
      player2Result.forEach((p2Result, p2ArrIndex) => {
        if (p2Result) {
          const secondPlayerStatistic: RawPlayerStatisticType = {
            pGamesCount: Number(p2Result.p2GamesCount),
            pId: p2Result.p2Id,
            pLogin: p2Result.p2Login,
            pSumScore: Number(p2Result.p2SumScore),
            pWinsCount: Number(p2Result.p2WinsCount),
            pLossesCount: Number(p2Result.p2LossesCount),
            pDrawsCount: Number(p2Result.p2DrawsCount),
          };
          resultArray.push(secondPlayerStatistic);
          delete player2Result[p2ArrIndex];
        }
      });
      return resultArray;
    };
    const rawPlayersStatistic: RawPlayerStatisticType[] = await mergeResults();
    const mappedPlayersStatistic: QuizGamePublicApiUsersTopViewModel[] =
      rawPlayersStatistic.map((rawPlayerStatistic) => {
        const rawAvgScores: string = (
          rawPlayerStatistic.pSumScore / rawPlayerStatistic.pGamesCount
        ).toFixed(2);
        let avgScores: number;
        if (
          rawAvgScores.substring(
            rawAvgScores.length - 2,
            rawAvgScores.length,
          ) === '00'
        ) {
          avgScores = Math.round(Number(rawAvgScores));
        } else {
          avgScores = Number(rawAvgScores);
        }
        return {
          sumScore: rawPlayerStatistic.pSumScore,
          avgScores,
          gamesCount: rawPlayerStatistic.pGamesCount,
          winsCount: rawPlayerStatistic.pWinsCount,
          lossesCount: rawPlayerStatistic.pLossesCount,
          drawsCount: rawPlayerStatistic.pDrawsCount,
          player: {
            id: String(rawPlayerStatistic.pId),
            login: rawPlayerStatistic.pLogin,
          },
        };
      });
    mappedPlayersStatistic.sort((a, b) => {
      // перебирает все условия заданной сортировки (критерий сортировки и направление)
      for (const sortData of paginationQuery.sort) {
        const sortBy: string = sortData.split(' ')[0];
        const sortDirection: 'asc' | 'desc' | string = sortData.split(' ')[1];
        // если это последний элемент массива из условий сортировки
        if (
          sortData === paginationQuery.sort[paginationQuery.sort.length - 1]
        ) {
          if (sortDirection === 'asc') {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            if (a[sortBy] === b[sortBy]) return 0;
          } else if (sortDirection === 'desc') {
            if (a[sortBy] > b[sortBy]) return -1;
            if (a[sortBy] < b[sortBy]) return 1;
            if (a[sortBy] === b[sortBy]) return 0;
          }
          // если это не последний элемент массива из условий сортировки то
          // при равенстве элементов между собой переходит на следующее условие и сортирует по следующему условию
        } else {
          if (sortDirection === 'asc') {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            if (a[sortBy] === b[sortBy]) continue;
          } else if (sortDirection === 'desc') {
            if (a[sortBy] > b[sortBy]) return -1;
            if (a[sortBy] < b[sortBy]) return 1;
            if (a[sortBy] === b[sortBy]) continue;
          }
        }
      }
    });
    const howMuchToSkip: number =
      paginationQuery.pageSize * (paginationQuery.pageNumber - 1);
    const pagesCount: number = Math.ceil(
      mappedPlayersStatistic.length / paginationQuery.pageSize,
    );
    return {
      pagesCount,
      page: Number(paginationQuery.pageNumber),
      pageSize: Number(paginationQuery.pageSize),
      totalCount: mappedPlayersStatistic.length,
      items: mappedPlayersStatistic.slice(
        howMuchToSkip,
        howMuchToSkip + paginationQuery.pageSize,
      ),
    };
  }
}
