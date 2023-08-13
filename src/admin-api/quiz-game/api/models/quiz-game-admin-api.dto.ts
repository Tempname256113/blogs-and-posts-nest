import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ArrayContainsStringOrNumber } from '../../../../../libs/validation/class-validator/array-contains-string-or-number.validation-decorator';

export type QuizGameAdminApiQueryDTO = {
  bodySearchTerm: string | undefined;
  publishedStatus: 'all' | 'published' | 'notPublished';
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  pageNumber: number;
  pageSize: number;
};

export class CreateQuizGameQuestionAdminApiDTO {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  body: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayContainsStringOrNumber()
  correctAnswers: (string | number)[];
}
