export class AllowedUserSchema {
  allowed_id!: number;

  allowed_username!: string;

  allowed_picture!: string | null;

  allowed_points!: number;

  allowed_fcm_token!: string;
}
