import { AccessRequestListSchema } from 'modules/access-request/schemas/access-request-list.schema';
import { UsersListSchema } from 'modules/users/schemas/users-list.schema';
import { UserEntity } from '../modules/users/entities/user.entity';
export class BaseResponseSchema {
  message!: string;

  userData?: UserEntity;

  userBlocks?: UsersListSchema[];

  userFollowings?: UsersListSchema[];

  silver_chips?: number;

  golden_chips?: number;

  available_points?: number;

  accessList?: AccessRequestListSchema[];

  userAccess?: UsersListSchema[];
}
