import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserBanUnbanDTO, UserCreateDto } from './models/user-api.dto';
import {
  UserViewModel,
  UserPaginationViewModel,
} from './models/user-api.models';
import { IUserApiPaginationQueryDto } from './models/user-api.query-dto';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from '../application/use-cases/delete-user-by-id.use-case';
import { BanUnbanUserCommand } from '../application/use-cases/ban-unban-user.use-case';
import { UserQueryRepositorySQL } from '../infrastructure/repositories/user.query-repository-sql';

@Controller('sa/users')
export class UserAdminController {
  constructor(
    private readonly usersQueryRepositorySQL: UserQueryRepositorySQL,
    private commandBus: CommandBus,
  ) {}
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: UserCreateDto,
  ): Promise<UserViewModel> {
    const createdUser: UserViewModel = await this.commandBus.execute<
      CreateUserCommand,
      UserViewModel
    >(new CreateUserCommand(createUserDTO));
    return createdUser;
  }

  @Put(':userId/ban')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUnbanUser(
    @Param('userId') userId: number,
    @Body() banUnbanDTO: UserBanUnbanDTO,
  ): Promise<void> {
    await this.commandBus.execute<BanUnbanUserCommand, void>(
      new BanUnbanUserCommand({ userId, banUnbanDTO: banUnbanDTO }),
    );
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUsersWithPagination(
    @Query() rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserPaginationViewModel> {
    const paginationQuery: IUserApiPaginationQueryDto = {
      searchLoginTerm: rawPaginationQuery.searchLoginTerm ?? null,
      searchEmailTerm: rawPaginationQuery.searchEmailTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
      banStatus: rawPaginationQuery.banStatus ?? 'all',
    };
    const usersWithPagination: UserPaginationViewModel =
      await this.usersQueryRepositorySQL.getUsersWithPagination(
        paginationQuery,
      );
    return usersWithPagination;
  }

  @Delete(':userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('userId') userId: number): Promise<void> {
    await this.commandBus.execute<DeleteUserByIdCommand, void>(
      new DeleteUserByIdCommand(userId),
    );
  }
}
