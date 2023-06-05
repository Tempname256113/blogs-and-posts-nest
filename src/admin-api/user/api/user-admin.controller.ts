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
import { UserBanUnbanDTO, UserApiCreateDto } from './models/user-api.dto';
import { UserApiModel, UserApiPaginationModel } from './models/user-api.models';
import { UserQueryRepository } from '../infrastructure/repositories/user.query-repository';
import { IUserApiPaginationQueryDto } from './models/user-api.query-dto';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from '../application/use-cases/delete-user-by-id.use-case';
import { BanUnbanUserCommand } from '../application/use-cases/ban-unban-user.use-case';

@Controller('sa/users')
export class UserAdminController {
  constructor(
    private userQueryRepository: UserQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: UserApiCreateDto,
  ): Promise<UserApiModel> {
    const createdUser: UserApiModel = await this.commandBus.execute<
      CreateUserCommand,
      UserApiModel
    >(new CreateUserCommand(createUserDTO));
    return createdUser;
  }

  @Put(':userId/ban')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async banUnbanUser(
    @Param('userId') userId: string,
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
  ): Promise<UserApiPaginationModel> {
    const paginationQuery: IUserApiPaginationQueryDto = {
      searchLoginTerm: rawPaginationQuery.searchLoginTerm ?? null,
      searchEmailTerm: rawPaginationQuery.searchEmailTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
      banStatus: rawPaginationQuery.banStatus ?? 'all',
    };
    const usersWithPagination: UserApiPaginationModel =
      await this.userQueryRepository.getUsersWithPagination(paginationQuery);
    return usersWithPagination;
  }

  @Delete(':userId')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('userId') userId: string): Promise<void> {
    await this.commandBus.execute<DeleteUserByIdCommand, void>(
      new DeleteUserByIdCommand(userId),
    );
  }
}
