import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UserRepositorySql } from '../../infrastructure/repositories/user.repository-sql';

export class DeleteUserByIdCommand {
  constructor(public readonly userId: number) {}
}

@CommandHandler(DeleteUserByIdCommand)
export class DeleteUserByIdUseCase
  implements ICommandHandler<DeleteUserByIdCommand, void>
{
  constructor(private readonly usersRepositorySQL: UserRepositorySql) {}

  async execute({ userId }: DeleteUserByIdCommand): Promise<void> {
    const deleteUserStatus: boolean =
      await this.usersRepositorySQL.deleteUserById(userId);
    if (!deleteUserStatus) throw new NotFoundException();
  }
}
