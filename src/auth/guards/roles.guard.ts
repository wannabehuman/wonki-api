import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // 역할이 지정되지 않은 경우 모든 인증된 사용자 접근 허용
    }

    const { user } = context.switchToHttp().getRequest();
    return user && requiredRoles.includes(user.role as UserRole);
  }
}
