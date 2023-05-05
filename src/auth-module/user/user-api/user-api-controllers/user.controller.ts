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
import { UserService } from '../../user-application/user.service';
import { UserApiCreateDto } from '../user-api-models/user-api.dto';
import {
  UserApiModelType,
  UserApiPaginationModelType,
} from '../user-api-models/user-api.models';
import { UserQueryRepository } from '../../user-infrastructure/user-repositories/user.query-repository';
import { IUserApiPaginationQueryDto } from '../user-api-models/user-api.query-dto';
import { BasicAuthGuard } from '../../../../../libs/auth/passport-strategy/auth-basic.strategy';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private userQueryRepository: UserQueryRepository,
  ) {}
  @Post()
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: UserApiCreateDto,
  ): Promise<UserApiModelType> {
    const createdUser: UserApiModelType = await this.userService.createUser(
      createUserDTO,
    );
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
    await this.userService.deleteUserById(userId);
  }
}
