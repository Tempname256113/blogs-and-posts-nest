import { IsString } from 'class-validator';

export class QuizGamePublicApiCreateAnswerDTO {
  @IsString()
  answer: string;
}

export type QuizGamePublicApiPaginationQueryDTO = {
  sortBy?: 'pairCreatedDate' | 'status' | 'startGameDate' | 'finishGameDate';
  sortDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
};

export type QuizGamePublicApiUsersTopQueryDTO = {
  sort: string[];
  pageNumber: number;
  pageSize: number;
};
