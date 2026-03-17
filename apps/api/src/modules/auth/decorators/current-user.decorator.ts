import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class CurrentUserPayload {
  id!: number;
  email!: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

