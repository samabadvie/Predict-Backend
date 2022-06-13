export class GetUserSchema {
  id?: number;

  username?: string;

  prefer_currency?: string;

  picture?: string | null;

  user_level_name?: string;

  user_level_icon?: string;

  email?: string;

  points?: number;

  available_points?: number;

  silver_chips?: number;

  silver_chips_max?: number;

  golden_chips?: number;

  referral_code?: string;

  playing_time?: number;

  default_coin?: string;

  num_of_following?: number;

  num_of_follower?: number;

  corrects?: number;

  total_predicts?: number;

  win_streaks?: number;

  score?: string;

  access_request_enable?: boolean;

  user_is_following?: boolean;

  other_is_following?: boolean;

  last_notification_time?: number;

  last_access_request_time?: number;
}
