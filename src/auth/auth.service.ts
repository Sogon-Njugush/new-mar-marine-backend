import { map } from 'rxjs/operators';
import { LoginDto } from './dto/login.dto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auth } from './entities/auth.entity';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/role/entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { UserEventService } from 'src/event/user-event.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Auth) private authRepository: Repository<Auth>,
    @InjectRepository(Role) private roleRepository: Repository<Role>,
    private jwtService: JwtService,
    private readonly userEventService: UserEventService,
  ) {}
  async create(createAuthDto: CreateAuthDto): Promise<{ user: Partial<Auth> }> {
    const accountExists = await this.authRepository.findOne({
      where: { email: createAuthDto.email },
    });
    if (accountExists) {
      throw new ConflictException('Account already exists');
    }

    const role = await this.roleRepository.findOne({
      where: { id: createAuthDto.role_id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }
    //hash password
    const hashedPassword = await this.hashPassword(createAuthDto.password);
    createAuthDto.password = hashedPassword;
    const newUser = this.authRepository.create({
      email: createAuthDto.email,
      username: createAuthDto.username,
      password: hashedPassword,
      role,
    });
    const saveUser = await this.authRepository.save(newUser);
    //emit user registered event
    this.userEventService.emitUserRegisteredEvent(saveUser);

    const { password, ...userWithoutPassword } = saveUser;
    return {
      user: userWithoutPassword,
    };
  }

  async login(LoginDto: LoginDto) {
    const user = await this.authRepository.findOne({
      relations: {
        role: true,
      },
      where: { email: LoginDto.email },
    });
    if (
      !user ||
      !(await this.verifyPassword(LoginDto.password, user.password))
    ) {
      throw new UnauthorizedException(
        'Invalid credentials or account not found!',
      );
    }
    //generate token
    const tokens = await this.generateToken(user);
    console.log(tokens);

    const { password, role, ...rest } = user;
    const userWithoutPassword = {
      ...rest,
      role_name: role.role_name,
      role_id: role.id,
    };
    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });
      const user = await this.authRepository.findOne({
        where: { id: payload.id },
      });
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const accessToken = this.generateAccessToken(user);
      return {
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async findAll() {
    const users = await this.authRepository.find({
      relations: {
        role: true,
      },
    });

    const usersWithoutPassword = users.map(({ password, role, ...rest }) => ({
      ...rest,
      role_name: role.role_name,
    }));

    return {
      users: usersWithoutPassword,
    };
  }

  //find current user by userID
  async getUserById(userId: number) {
    const user = await this.authRepository.findOne({
      relations: {
        role: true,
      },
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, role, ...rest } = user;
    const userWithoutPassword = {
      ...rest,
      role_name: role.role_name,
    };
    return userWithoutPassword;
  }

  // async findOne(id: number) {
  //   return `This action returns a #${id} auth`;
  // }

  async update(updateAuthDto: UpdateAuthDto) {
    const user = await this.authRepository.findOne({
      where: { id: updateAuthDto.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = this.authRepository.merge(user, updateAuthDto);
    const savedUser = await this.authRepository.save(updatedUser);

    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  async remove(id: number) {
    const deletedUser = await this.authRepository.findOne({
      where: { id: id },
    });
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return this.authRepository.remove(deletedUser);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
  private async generateToken(user: Auth) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  private generateAccessToken(user: Auth): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m',
    });
  }
  private generateRefreshToken(user: Auth): string {
    const payload = {
      id: user.id,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '1m',
    });
  }
}
