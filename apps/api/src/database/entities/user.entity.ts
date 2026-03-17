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
  @Column({ unique: true, length: 255, nullable: true })
  email?: string;

  @Column({ length: 255, nullable: true })
  password?: string; // bcrypt hashed, null for Steam-only users

  @Column({ name: 'display_name', length: 100, nullable: true })
  displayName?: string;

  @Index()
  @Column({ name: 'steam_id', length: 20, unique: true, nullable: true })
  steamId?: string; // Steam 64-bit ID

  @Column({ name: 'steam_avatar', length: 255, nullable: true })
  steamAvatar?: string; // Steam avatar URL

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserGame, (userGame) => userGame.user)
  userGames: UserGame[];

  @OneToMany(() => CustomTag, (tag) => tag.user)
  tags: CustomTag[];
}

