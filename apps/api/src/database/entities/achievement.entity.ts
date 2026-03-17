import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { UserGame } from './user-game.entity';

@Entity('achievements')
@Unique(['userGame', 'apiName'])
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => UserGame, (userGame) => userGame.achievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_game_id' })
  userGame: UserGame;

  @Column({ name: 'user_game_id' })
  userGameId: number;

  @Column({ name: 'api_name', length: 255 })
  apiName: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl?: string;

  @Column({ name: 'icon_gray_url', type: 'text', nullable: true })
  iconGrayUrl?: string;

  @Column({ default: false })
  achieved: boolean;

  @Column({ name: 'unlock_time', type: 'timestamp', nullable: true })
  unlockTime?: Date;

  @Column({ name: 'global_percent', type: 'decimal', precision: 5, scale: 2, nullable: true })
  globalPercent?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

