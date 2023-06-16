import { IsBoolean } from 'class-validator';

export class BanBlogAdminApiDTO {
  @IsBoolean()
  isBanned: boolean;
}
