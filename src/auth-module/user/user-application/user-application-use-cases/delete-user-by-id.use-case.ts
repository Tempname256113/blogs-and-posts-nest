import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../user-infrastructure/user-repositories/user.repository';

export class DeleteUserByIdCommand {
  constructor(public readonly userId: string) {}
}

@CommandHandler(DeleteUserByIdCommand)
export class DeleteUserByIdUseCase
  implements ICommandHandler<DeleteUserByIdCommand, void>
{
  constructor(private userRepository: UserRepository) {}

  async execute({ userId }: DeleteUserByIdCommand): Promise<void> {
    const deleteUserStatus: boolean = await this.userRepository.deleteUserById(
      userId,
    );
    if (!deleteUserStatus) throw new NotFoundException();
  }
}
