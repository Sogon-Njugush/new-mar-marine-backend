import { Auth } from 'src/auth/entities/auth.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  GHOST = 'ghost',
}

@Entity()
export class Role {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.GHOST })
  role_name: UserRole;
  @Column()
  role_description: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @OneToMany(() => Auth, (auth) => auth.role)
  users: Auth[];
}
