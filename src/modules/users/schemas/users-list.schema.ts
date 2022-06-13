export class UsersListSchema {
  id?: number;

  username!: string;

  picture!: string | null;

  points!: number;

  rank?: number;

  block?: boolean;

  block_by?: boolean;

  num_of_following?: number;

  num_of_follower?: number;

  fcm_token?: string;

  access_request_enable?: boolean;
}
