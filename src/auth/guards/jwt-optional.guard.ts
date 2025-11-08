import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  // Override handleRequest to make authentication optional
  handleRequest(err, user, info, context) {
    // 토큰이 있지만 만료된 경우 - 자동 로그아웃을 위해 에러 반환
    if (info?.name === 'TokenExpiredError') {
      throw new UnauthorizedException('토큰이 만료되었습니다. 다시 로그인해주세요.');
    }

    // 토큰이 있지만 유효하지 않은 경우 (잘못된 서명 등)
    if (info?.name === 'JsonWebTokenError') {
      throw new UnauthorizedException('유효하지 않은 토큰입니다. 다시 로그인해주세요.');
    }

    // 기타 에러가 있는 경우
    if (err) {
      throw err;
    }

    // 토큰이 없는 경우 - null 반환 (조회 등의 작업 허용)
    // 토큰이 있고 유효한 경우 - user 객체 반환
    return user || null;
  }
}
