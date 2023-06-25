import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  userSchema,
  UserSchema,
} from '../libs/db/mongoose/schemes/user.entity';
import { UserRepository } from '../src/admin-api/user/infrastructure/repositories/user.repository';
import { randomUUID } from 'crypto';
import mongoose, { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EnvConfiguration } from '../app-configuration/environment/env-configuration';
import { MongooseSchemesModule } from '../libs/db/mongoose/mongoose.schemes-module';

describe('db test', () => {
  it('add new user db test', async () => {
    const mongoServer = await MongoMemoryServer.create();
    const mongooseUri = mongoServer.getUri();
    await mongoose.connect(mongooseUri);

    const userRepositoryModule: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(new EnvConfiguration().MONGO_LOCAL),
        // MongooseSchemesModule,
        MongooseModule.forFeature([
          { name: UserSchema.name, schema: userSchema },
        ]),
      ],
      providers: [UserRepository],
    }).compile();

    class myModelMock {
      create = jest.fn((dto) => {
        return {
          id: new Date().toISOString(),
          ...dto,
        };
      });
      save = jest.fn((dto) => {
        return 'saved';
      });
    }

    // const module: TestingModule = await Test.createTestingModule({
    //   imports: [MongooseModule.forRoot(mongooseUri)],
    //   providers: [
    //     {
    //       provide: getModelToken(UserSchema.name),
    //       useValue: myModelMock,
    //     },
    //     UserRepository,
    //   ],
    // }).compile();

    // const mockUserModel = module.get<Model<UserSchema>>(
    //   getModelToken(UserSchema.name),
    // );
    const mockUserRepository =
      userRepositoryModule.get<UserRepository>(UserRepository);

    const user: User = {
      id: randomUUID(),
      accountData: {
        login: randomUUID(),
        createdAt: new Date().toISOString(),
        email: randomUUID(),
        password: '123',
      },
      emailConfirmation: {
        isConfirmed: true,
        confirmationCode: null,
        expirationDate: null,
      },
      passwordRecovery: {
        recoveryCode: null,
        recoveryStatus: false,
      },
      banInfo: {
        isBanned: false,
        banReason: null,
        banDate: null,
      },
    };
    const saveUserResult = await mockUserRepository.saveUser2(user);
    expect(saveUserResult).toBe('saved');
    await mongoose.disconnect();
  });
});
