import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiExtraModels(RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with email and password. Password will be securely hashed.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'Required data for user registration',
    examples: {
      valid: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOjEsImlhdCI6MTcwMTI3NjE5OSwiZXhwIjoxNzAxODgwOTk5fQ.xxx',
        message: 'User registered successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists or invalid data provided',
    schema: {
      example: {
        statusCode: 400,
        message: 'User already exists',
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate a user with email and password, returning a JWT token valid for 7 days',
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials',
    examples: {
      valid: {
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, JWT token returned',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOjEsImlhdCI6MTcwMTI3NjE5OSwiZXhwIjoxNzAxODgwOTk5fQ.xxx',
        message: 'Login successful',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token using a valid refresh token',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token data',
    examples: {
      valid: {
        value: {
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Token refreshed successfully with new access and refresh tokens',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOjEsImlhdCI6MTcwMTI3NjE5OSwiZXhwIjoxNzAxODgwOTk5fQ.xxx',
        refresh_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJzdWIiOjEsImlhdCI6MTcwMTI3NjE5OSwiZXhwIjoxNzAyODgwOTk5fQ.xxx',
        message: 'Token refreshed successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        error: 'Unauthorized',
      },
    },
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the data of the authenticated user. Requires a valid JWT token in the Authorization header',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 1,
        email: 'user@example.com',
        message: 'User profile retrieved successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      message: 'User profile retrieved successfully',
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Allows an authenticated user to change their password. Requires current password as validation',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Data for changing the password',
    examples: {
      valid: {
        value: {
          currentPassword: 'password123',
          newPassword: 'newPassword456',
          confirmPassword: 'newPassword456',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password updated successfully',
    schema: {
      example: {
        message: 'Password updated successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Passwords do not match or current password is incorrect',
    schema: {
      example: {
        statusCode: 400,
        message: 'Passwords do not match',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired JWT token',
  })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(user.id, changePasswordDto);
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current user permissions',
    description:
      'Returns all permissions for the authenticated user (from role + custom)',
  })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
    schema: {
      example: {
        permissions: [
          'voters:read',
          'voters:create',
          'voters:update',
          'candidates:read',
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired JWT token',
  })
  async getPermissions(@CurrentUser() user: any) {
    const permissions = await this.authService.getUserPermissions(
      user.id,
      user.roleId,
    );
    return {
      permissions,
    };
  }
}
