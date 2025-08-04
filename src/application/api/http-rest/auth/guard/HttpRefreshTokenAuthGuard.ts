import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class HttpRefreshTokenAuthGuard extends AuthGuard('jwt-refresh') {} 