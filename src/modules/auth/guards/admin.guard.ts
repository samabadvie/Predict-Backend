/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, admin: any, _info: any, _context: any, _status?: any) {
    if (err || !admin || !admin.is_admin) {
      throw err || new UnauthorizedException('Unauthorize Error in AdminGuard!');
    }
    return admin;
  }
}
