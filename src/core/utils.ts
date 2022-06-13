import { generate } from 'randomstring';

export function otpCodeGenerator(length = 6): string {
  const otp = generate({
    charset: 'numeric',
    length,
  });

  return otp[0] == '0' ? `1${otp.substring(1)}` : otp;
}
