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

export class User {
  id: string;
  accountData: UserAccountData;
  emailConfirmation: UserEmailConfirmation;
  passwordRecovery: UserPasswordRecovery;
}

class UserMethods extends User {
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
    ];
    return userProperties;
  }
}

@Schema({ versionKey: false, collection: 'users' })
export class UserSchema extends UserMethods implements User {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  accountData: UserAccountData;

  @Prop({ required: true })
  emailConfirmation: UserEmailConfirmation;

  @Prop({ required: true })
  passwordRecovery: UserPasswordRecovery;
}

export const userSchema = SchemaFactory.createForClass(UserSchema);
userSchema.loadClass(UserSchema);

export type UserDocument = HydratedDocument<UserSchema>;
