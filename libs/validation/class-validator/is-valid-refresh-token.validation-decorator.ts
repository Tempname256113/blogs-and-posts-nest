import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Session,
  SessionSchema,
} from '../../db/mongoose/schemes/session.entity';
import { JwtRefreshTokenPayloadType } from '../../../generic-models/jwt.payload.model';
import { JwtHelpers } from '../../auth/jwt/jwt-helpers.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsValidRefreshTokenConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    private jwtHelpers: JwtHelpers,
  ) {}
  async validate(
    refreshToken: string | undefined,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    if (typeof refreshToken !== 'string') {
      return false;
    }
    const decodeReqRefreshToken = (): JwtRefreshTokenPayloadType => {
      const reqRefreshTokenPayload: JwtRefreshTokenPayloadType | null =
        this.jwtHelpers.verifyRefreshToken(refreshToken);
      if (!reqRefreshTokenPayload) {
        throw new UnauthorizedException();
      }
      return reqRefreshTokenPayload;
    };
    const reqRefreshTokenPayload: JwtRefreshTokenPayloadType =
      decodeReqRefreshToken();
    const foundedSessionFromDB: Session | null =
      await this.SessionModel.findOne({
        deviceId: reqRefreshTokenPayload.deviceId,
      }).lean();
    if (!foundedSessionFromDB) {
      throw new UnauthorizedException();
    }
    if (reqRefreshTokenPayload.iat !== foundedSessionFromDB.iat) {
      throw new UnauthorizedException();
    }
    return true;
  }
}

export function IsValidRefreshToken(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRefreshTokenConstraint,
    });
  };
}
