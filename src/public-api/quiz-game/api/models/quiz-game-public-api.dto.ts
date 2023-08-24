import { IsString } from 'class-validator';

export class QuizGamePublicApiCreateAnswerDTO {
  @IsString()
  answer: string;
}
