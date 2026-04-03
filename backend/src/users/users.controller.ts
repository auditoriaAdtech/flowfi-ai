import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { UsersService } from './users.service';
import { Request } from 'express';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.usersService.getMe(userId);
  }

  @Patch('profile')
  updateProfile(
    @Req() req: Request,
    @Body() body: { name?: string; locale?: string; currency?: string },
  ) {
    const userId = (req as any).user.userId;
    return this.usersService.updateProfile(userId, body);
  }
}
