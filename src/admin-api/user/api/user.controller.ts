import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserApiCreateDto } from './models/user-api.dto';
import {
  UserApiModelType,
  UserApiPaginationModelType,
} from './models/user-api.models';
import { UserQueryRepository } from '../infrastructure/repositories/user.query-repository';
import { IUserApiPaginationQueryDto } from './models/user-api.query-dto';
import { BasicAuthGuard } from '../../../../libs/auth/passport-strategy/auth-basic.strategy';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '../application/use-cases/create-user.use-case';
import { DeleteUserByIdCommand } from '../application/use-cases/delete-user-by-id.use-case';

@Controller('users')
export class UserController {
  constructor(
    private userQueryRepository: UserQueryRepository,
    private commandBus: CommandBus,
  ) {}
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: UserApiCreateDto,
  ): Promise<UserApiModelType> {
    const createdUser: UserApiModelType = await this.commandBus.execute<
      CreateUserCommand,
      UserApiModelType
    >(new CreateUserCommand(createUserDTO));
    return createdUser;
  }

  @Get()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getUsersWithPagination(
    @Query() rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<UserApiPaginationModelType> {
    const paginationQuery: IUserApiPaginationQueryDto = {
      searchLoginTerm: rawPaginationQuery.searchLoginTerm ?? null,
      searchEmailTerm: rawPaginationQuery.searchEmailTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const usersWithPagination: UserApiPaginationModelType =
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