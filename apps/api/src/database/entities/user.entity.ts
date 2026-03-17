import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UserGame } from './user-game.entity';
import { CustomTag } from './custom-tag.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string; // bcrypt hashed

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserGame, (userGame) => userGame.user)
  userGames: UserGame[];

  @OneToMany(() => CustomTag, (tag) => tag.user)
  tags: CustomTag[];
}

