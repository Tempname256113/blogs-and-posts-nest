import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export class User {
  id: string;
  accountData: UserAccountData;
  emailConfirmation: UserEmailConfirmation;
  passwordRecovery: UserPasswordRecovery;
}

class UserMethods extends User {}

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
