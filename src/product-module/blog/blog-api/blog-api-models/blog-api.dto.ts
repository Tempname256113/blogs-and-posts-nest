import { IsEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class IBlogApiCreateUpdateDTO {
  @IsString()
  @IsEmpty()
  @MaxLength(15)
  name: string;

  @IsString()
  @IsEmpty()
  @MaxLength(500)
  description: string;

  @IsUrl()
  @MaxLength(100)
  websiteUrl: string;
}

export class IBlogApiCreatePostDTO {
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
}
