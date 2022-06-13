import { ConfirmEmailEnum } from '../../../core/confirm-email.enum';
import { UserEntity } from '../entities/user.entity';
export class ConfirmOtpcodeResponseSchema {
  message!: ConfirmEmailEnum;

  userData?: UserEntity;
}
