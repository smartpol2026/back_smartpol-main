import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { PermissionsService } from '../../permissions/permissions.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from 'src/database/entities/organizations.entity';
import { User } from 'src/database/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private permissionsService: PermissionsService,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async register(registerDto: RegisterDto) {
    // Verificar si el usuario ya existe
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crear nuevo usuario
    const usuario = await this.userService.create({
      email: registerDto.email,
      password: hashedPassword,
    });

    // Generar JWT
    const accessToken = await this.generateToken(usuario);
    const refreshToken = await this.generateRefreshToken(usuario);

    return {
      id: usuario.id,
      email: usuario.email,
      roleId: usuario.role?.id ?? null,
      organizationId: null as number | null,
      organizationName: null as string | null,
      access_token: accessToken,
      refresh_token: refreshToken,
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto) {
    // Buscar usuario con relaciones
    const usuario = await this.userRepository.findOne({
      where: { email: loginDto.email },
      relations: ['role', 'organization'],
    });

    if (!usuario) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let organizationId: number | null = null;
    let organizationName: string | null = null;

    // Si el usuario tiene organización asignada
    if (usuario.organizationId) {
      organizationId = usuario.organizationId;
      organizationName = usuario.organization?.name ?? null;
    }

    // Generar JWT
    const accessToken = await this.generateToken(usuario);
    const refreshToken = await this.generateRefreshToken(usuario);

    return {
      id: usuario.id,
      email: usuario.email,
      roleId: usuario.role?.id ?? null,
      organizationId,
      organizationName,
      access_token: accessToken,
      refresh_token: refreshToken,
      message: 'Login successful',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // Validar que las contraseñas nuevas coincidan
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Obtener usuario
    const usuario = await this.userService.findOne(userId);
    if (!usuario) {
      throw new UnauthorizedException('User not found');
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      usuario.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Actualizar contraseña
    await this.userService.updatePassword(userId, hashedPassword);

    return {
      message: 'Password updated successfully',
    };
  }

  async refreshToken(refreshTokenString: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshTokenString);

      // Get the user with relations
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role', 'organization'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      let organizationId: number | null = null;
      let organizationName: string | null = null;

      // Si el usuario tiene organización asignada
      if (user.organizationId) {
        organizationId = user.organizationId;
        organizationName = user.organization?.name ?? null;
      }

      // Generate new access token
      const newAccessToken = await this.generateToken(user);

      // Generate new refresh token
      const newRefreshToken = await this.generateRefreshToken(user);

      return {
        id: user.id,
        email: user.email,
        roleId: user.role?.id ?? null,
        organizationId,
        organizationName,
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        message: 'Token refreshed successfully',
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateToken(usuario: any): Promise<string> {
    const payload = {
      email: usuario.email,
      sub: usuario.id,
      roleId: usuario.role?.id ?? null,
      organizationId: usuario.organizationId ?? null,
    };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(usuario: any): Promise<string> {
    const payload = {
      email: usuario.email,
      sub: usuario.id,
      roleId: usuario.role?.id ?? null,
      organizationId: usuario.organizationId ?? null,
    };
    return this.jwtService.sign(payload, { expiresIn: '30d' });
  }

  /**
   * Obtiene los permisos del usuario autenticado
   */
  async getUserPermissions(userId: number, roleId: number): Promise<string[]> {
    if (!roleId) {
      return [];
    }
    return await this.permissionsService.getUserPermissions(userId, roleId);
  }
}
