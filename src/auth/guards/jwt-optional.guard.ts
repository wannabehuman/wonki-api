import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  // Override handleRequest to make authentication optional
  handleRequest(err, user, info, context) {
    // If there's an error or no user, just return null instead of throwing
    // This allows the request to proceed without authentication
    return user || null;
  }
}
