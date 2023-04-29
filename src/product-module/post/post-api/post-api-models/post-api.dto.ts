import { IsEmpty, IsString, MaxLength } from 'class-validator';

export class IPostApiCreateUpdateDTO {
  @IsString()
  @IsEmpty()
  @MaxLength(30)
  title: string;

  @IsString()
  @IsEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  @IsEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsEmpty()
  blogId: string;
}
