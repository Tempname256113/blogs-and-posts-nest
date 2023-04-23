import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../../user-application/user.service';
import { UserApiCreateDto } from '../user-api-models/user-api.dto';
import {
  IUserApiModel,
  IUserApiPaginationModel,
} from '../user-api-models/user-api.models';
import { UserQueryRepository } from '../../user-infrastructure/user-repositories/user.query-repository';
import { IUserApiPaginationQueryDto } from '../user-api-models/user-api.query-dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private userQueryRepository: UserQueryRepository,
  ) {}
  @Post()
  @UseGuards(AuthGuard('basic'))
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: UserApiCreateDto,
  ): Promise<IUserApiModel> {
    const createdUser: IUserApiModel = await this.userService.createUser(
      createUserDTO,
    );
    return createdUser;
  }

  @Get()
  @UseGuards(AuthGuard('basic'))
  @HttpCode(HttpStatus.OK)
  async getUsersWithPagination(
    @Query() rawPaginationQuery: IUserApiPaginationQueryDto,
  ): Promise<IUserApiPaginationModel> {
    const paginationQuery: IUserApiPaginationQueryDto = {
      searchLoginTerm: rawPaginationQuery.searchLoginTerm ?? null,
      searchEmailTerm: rawPaginationQuery.searchEmailTerm ?? null,
      pageNumber: rawPaginationQuery.pageNumber ?? 1,
      pageSize: rawPaginationQuery.pageSize ?? 10,
      sortBy: rawPaginationQuery.sortBy ?? 'createdAt',
      sortDirection: rawPaginationQuery.sortDirection ?? 'desc',
    };
    const usersWithPagination: IUserApiPaginationModel =
      await this.userQueryRepository.getUsersWithPagination(paginationQuery);
    return usersWithPagination;
  }

  @Delete(':userId')
  @UseGuards(AuthGuard('basic'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserById(@Param('userId') userId: string) {
    const deletedUserStatus = await this.userService.deleteUserById(userId);
    if (!deletedUserStatus) throw new NotFoundException();
  }
}
