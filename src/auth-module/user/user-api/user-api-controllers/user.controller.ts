import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserService } from '../../user-application/user.service';
import { IUserApiCreateDto } from '../user-api-models/user-api.dto';
import { IUserApiModel } from '../user-api-models/user-api.model';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
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
}
