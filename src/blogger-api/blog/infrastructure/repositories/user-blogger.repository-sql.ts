import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BannedUsersByBloggerSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/users/banned-users-by-blogger-sql.entity';

@Injectable()
export class BloggerUserRepositorySQL {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(BannedUsersByBloggerSQLEntity)
    private readonly bannedUsersByBloggerEntity: Repository<BannedUsersByBloggerSQLEntity>,
  ) {}

  async banUser(banUserDTO: {
    userId: string;
    blogId: string;
    banReason: string;
  }): Promise<void> {
    await this.bannedUsersByBloggerEntity.insert({
      userId: Number(banUserDTO.userId),
      blogId: Number(banUserDTO.blogId),
      banReason: banUserDTO.banReason,
      banDate: new Date().toISOString(),
    });
  }

  async unbanUser(unbanUserDTO: {
    userId: string;
    blogId: string;
  }): Promise<void> {
    await this.bannedUsersByBloggerEntity.delete({
      userId: Number(unbanUserDTO.userId),
      blogId: Number(unbanUserDTO.blogId),
    });
  }
}
