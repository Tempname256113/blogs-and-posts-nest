import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from '../../user-application/user.service';
import { IUserApiCreateDto } from '../user-api-models/user-api.dto';
import {
  IUserApiModel,
  IUserApiPaginationModel,
} from '../user-api-models/user-api.models';
import { UserQueryRepository } from '../../user-infrastructure/user-repositories/user.query-repository';
import { IUserApiPaginationQueryDto } from '../user-api-models/user-api.query-dto';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private userQueryRepository: UserQueryRepository,
  ) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() createUserDTO: IUserApiCreateDto,
  ): Promise<IUserApiModel> {
    const createdUser: IUserApiModel = await this.userService.createUser(
      createUserDTO,
    );
    return createdUser;
  }

  @Get()
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
}
