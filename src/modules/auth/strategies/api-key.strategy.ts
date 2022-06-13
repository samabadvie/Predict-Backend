/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type*/
/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/ban-types */

import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ValidationException } from '../../../core/exceptions';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private readonly authService: AuthService) {
    super(
      {
        header: 'X-Api-Key',
        prefix: '',
      },
      true,
      (apiKey: string, done: any, req: any, next: () => void) => {
        req = false;
        const checkKey = this.authService.validateApiKey(apiKey);
        if (!checkKey) {
          return done(
            new ValidationException([
              {
                message: 'Unauthorized access, Your API key not correct',
                field: '1',
                validation: '1',
              },
            ]),
            req,
          );
        }
        return done(null, true, next);
      },
    );
  }
}
