import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const allowed = await super.canActivate(context);
    if (!allowed) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;

    const permission = this.permissionFromRequest(request);
    if (permission === 'GET /auth/me') return true;

    if (
      permission.startsWith('GET /permissions') ||
      permission.startsWith('PUT /permissions')
    ) {
      throw new ForbiddenException('Solo ADMIN puede configurar permisos.');
    }

    const match = await this.prisma.rolePermission.findUnique({
      where: {
        role_permission: {
          role: user.role,
          permission,
        },
      },
    });

    if (!match?.allowed) {
      throw new ForbiddenException(`No tienes permiso: ${permission}`);
    }

    return true;
  }

  private permissionFromRequest(request: any) {
    const routePath = request.route?.path ?? '';
    const baseUrl = request.baseUrl ?? '';
    const path = `${baseUrl}${routePath === '/' ? '' : routePath}`.replace(
      /\/+/g,
      '/',
    );

    return `${request.method} ${path || request.path}`;
  }
}
