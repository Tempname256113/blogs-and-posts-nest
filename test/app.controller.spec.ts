import { Test, TestingModule } from '@nestjs/testing';
/*import { AppController } from '../src/AppModule/app.controller';
import { AppService } from '../src/AppModule/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});*/
import {
  User,
  userSchema,
  UserSchema,
  UserSchema as UserSchemaImp,
} from '../libs/db/mongoose/schemes/user.entity';
import { UserRepository } from '../src/admin-api/user/infrastructure/repositories/user.repository';
import { randomUUID } from 'crypto';
import mongoose, { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { MongooseSchemesModule } from '../libs/db/mongoose/mongoose.schemes-module';
import { ConfigModule } from '@nestjs/config';

// class UserAccountData {
//   login: string;
//   email: string;
//   password: string;
//   createdAt: string;
// }
//
// class UserEmailConfirmation {
//   confirmationCode: string | null;
//   expirationDate: string | null;
//   isConfirmed: boolean;
// }
//
// class UserPasswordRecovery {
//   recoveryCode: string | null;
//   recoveryStatus: boolean;
// }
//
// export class UserBanStatus {
//   banned: boolean;
//   banReason: string | null;
//   banDate: string | null;
// }
//
// type User = {
//   id: string;
//   accountData: UserAccountData;
//   emailConfirmation: UserEmailConfirmation;
//   passwordRecovery: UserPasswordRecovery;
//   banStatus?: UserBanStatus;
// };
//
// class UserSchemaMethods {
//   id: string;
//
//   accountData: UserAccountData;
//
//   emailConfirmation: UserEmailConfirmation;
//
//   passwordRecovery: UserPasswordRecovery;
//
//   banStatus: UserBanStatus;
//
//   confirmRegistration(): boolean {
//     if (new Date().toISOString() > this.emailConfirmation.expirationDate) {
//       return false;
//     }
//     this.emailConfirmation.isConfirmed = true;
//     this.emailConfirmation.confirmationCode = null;
//     this.emailConfirmation.expirationDate = null;
//     return true;
//   }
//
//   changeEmailConfirmationCode(newEmailConfirmationCode: string): boolean {
//     if (this.emailConfirmation.isConfirmed) {
//       return false;
//     } else {
//       this.emailConfirmation.confirmationCode = newEmailConfirmationCode;
//       this.emailConfirmation.expirationDate = add(new Date(), {
//         days: 3,
//       }).toISOString();
//       return true;
//     }
//   }
//
//   setPasswordRecoveryCode(newPasswordRecoveryCode: string) {
//     this.passwordRecovery.recoveryCode = newPasswordRecoveryCode;
//     this.passwordRecovery.recoveryStatus = true;
//   }
//
//   setNewPassword(newPassword: string) {
//     this.passwordRecovery.recoveryStatus = false;
//     this.passwordRecovery.recoveryCode = null;
//     this.accountData.password = newPassword;
//   }
//
//   getPossibleModifiedProperties(): string[] {
//     const userProperties: string[] = [
//       'accountData.login',
//       'accountData.email',
//       'accountData.password',
//       'emailConfirmation.confirmationCode',
//       'emailConfirmation.expirationDate',
//       'emailConfirmation.isConfirmed',
//       'passwordRecovery.recoveryCode',
//       'passwordRecovery.recoveryStatus',
//       'banStatus.banned',
//       'banStatus.banReason',
//       'banStatus.banDate',
//     ];
//     return userProperties;
//   }
// }
//
// const UserSchema = new Schema({
//   id: String,
//
//   accountData: {
//     login: String,
//     email: String,
//     password: String,
//     createdAt: String,
//   },
//
//   emailConfirmation: {
//     confirmationCode: String,
//     expirationDate: String,
//     isConfirmed: String,
//   },
//
//   passwordRecovery: {
//     recoveryCode: String,
//     recoveryStatus: Boolean,
//   },
//
//   banStatus: { banned: Boolean, banReason: String, banDate: String },
// });
//
// UserSchema.loadClass(UserSchemaMethods);

describe('db test', () => {
  it('add new user db test', async () => {
    // const mongoServer = await MongoMemoryServer.create();
    // const mongooseUri = mongoServer.getUri();
    // await mongoose.connect(mongooseUri);

    // const userRepositoryModule: TestingModule = await Test.createTestingModule({
    //   providers: [
    //     UserRepository,
    //     { provide: getModelToken(UserSchema.name), useValue: userSchema },
    //   ],
    // }).compile();
    // const userRepository: UserRepository =
    //   userRepositoryModule.get<UserRepository>(UserRepository);

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

    const module: TestingModule = await Test.createTestingModule({
      // imports: [MongooseModule.forRoot(mongooseUri)],
      providers: [
        {
          provide: getModelToken(UserSchema.name),
          useValue: myModelMock,
        },
        UserRepository,
      ],
    }).compile();

    // const mockUserModel = module.get<Model<UserSchema>>(
    //   getModelToken(UserSchema.name),
    // );
    const mockUserRepository = module.get<UserRepository>(UserRepository);

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
    // const saveUserResult = await mockUserRepository.saveUser2(user);
    // expect(saveUserResult).toBe('saved');
    // await mongoose.disconnect();
  });

  it('should be successful completed', () => {
    expect(2 + 2).toBe(4);
  });
});
