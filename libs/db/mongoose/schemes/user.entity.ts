import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { add } from 'date-fns';

class UserAccountData {
  login: string;
  email: string;
  password: string;
  createdAt: string;
}

class UserEmailConfirmation {
  confirmationCode: string | null;
  expirationDate: string | null;
  isConfirmed: boolean;
}

class UserPasswordRecovery {
  recoveryCode: string | null;
  recoveryStatus: boolean;
}

export class UserBanInfo {
  isBanned: boolean;
  banReason: string | null;
  banDate: string | null;
}

/* используются здесь классы из за того что декораторы не видят типов, но могут видеть классы.
 * можно и без классов создавать схему, но тогда typescript подсказок не будет и придется
 * самому смотреть и писать свойства. или сделать как я сделал. в nest лучше делать так как я */

export type User = {
  id: string;
  accountData: UserAccountData;
  emailConfirmation: UserEmailConfirmation;
  passwordRecovery: UserPasswordRecovery;
  banInfo?: UserBanInfo;
};

@Schema({ versionKey: false, collection: 'users' })
export class UserSchema implements User {
  @Prop()
  id: string;

  @Prop()
  accountData: UserAccountData;

  @Prop()
  emailConfirmation: UserEmailConfirmation;

  @Prop()
  passwordRecovery: UserPasswordRecovery;

  @Prop({ default: { banned: false, banReason: null, banDate: null } })
  banInfo: UserBanInfo;

  confirmRegistration(): boolean {
    if (new Date().toISOString() > this.emailConfirmation.expirationDate) {
      return false;
    }
    this.emailConfirmation.isConfirmed = true;
    this.emailConfirmation.confirmationCode = null;
    this.emailConfirmation.expirationDate = null;
    return true;
  }

  changeEmailConfirmationCode(newEmailConfirmationCode: string): boolean {
    if (this.emailConfirmation.isConfirmed) {
      return false;
    } else {
      this.emailConfirmation.confirmationCode = newEmailConfirmationCode;
      this.emailConfirmation.expirationDate = add(new Date(), {
        days: 3,
      }).toISOString();
      return true;
    }
  }

  setPasswordRecoveryCode(newPasswordRecoveryCode: string) {
    this.passwordRecovery.recoveryCode = newPasswordRecoveryCode;
    this.passwordRecovery.recoveryStatus = true;
  }

  setNewPassword(newPassword: string) {
    this.passwordRecovery.recoveryStatus = false;
    this.passwordRecovery.recoveryCode = null;
    this.accountData.password = newPassword;
  }

  getPossibleModifiedProperties(): string[] {
    const userProperties: string[] = [
      'accountData.login',
      'accountData.email',
      'accountData.password',
      'emailConfirmation.confirmationCode',
      'emailConfirmation.expirationDate',
      'emailConfirmation.isConfirmed',
      'passwordRecovery.recoveryCode',
      'passwordRecovery.recoveryStatus',
      'banStatus.banned',
      'banStatus.banReason',
      'banStatus.banDate',
    ];
    return userProperties;
  }
}

export const userSchema = SchemaFactory.createForClass(UserSchema);
userSchema.loadClass(UserSchema);

export type UserDocument = HydratedDocument<UserSchema>;
