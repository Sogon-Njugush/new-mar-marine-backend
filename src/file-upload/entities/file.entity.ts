import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn()
  id: string;
  @Column()
  originalname: string;
  @Column()
  mimetype: string;
  @Column()
  size: number;
  @Column()
  url: string;
  @Column()
  publicId: string;
  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
