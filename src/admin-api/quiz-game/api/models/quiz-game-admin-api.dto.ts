import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
  @IsString({ each: true })
  correctAnswers: string[];
}

export class UpdateQuizGameQuestionAdminApiDTO {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  body: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  correctAnswers: string[];
}

export class PublishQuizGameQuestionAdminApiDTO {
  @IsBoolean()
  published: boolean;
}
