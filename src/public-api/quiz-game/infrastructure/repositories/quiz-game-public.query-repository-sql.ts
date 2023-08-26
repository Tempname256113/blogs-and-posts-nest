import { Injectable, NotFoundException } from '@nestjs/common';
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
    quizPairQuestionsWithPositions.forEach((question) => {
      const quizGameQuestion: QuizGameQuestionSQLEntity =
        foundedQuizPair.questions.find((q) => {
          return q.id === question.questionId;
        });
      quizPairQuestionsWithCorrectPositions[question.questionPosition] = {
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
    const firstPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[] =
      getPlayerAnswers(1);
    const secondPlayerAnswers: QuizGamePublicApiPlayerAnswerViewModel[] =
      getPlayerAnswers(2);
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
}
