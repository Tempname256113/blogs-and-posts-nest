import { IsString, MaxLength, MinLength } from 'class-validator';

export class CommentApiCreateDto {
  @IsString()
  @MinLength(20)
  @MaxLength(300)
  content: string;
}
