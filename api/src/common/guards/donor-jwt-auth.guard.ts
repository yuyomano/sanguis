import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DonorJwtAuthGuard extends AuthGuard('donor-jwt') {}
