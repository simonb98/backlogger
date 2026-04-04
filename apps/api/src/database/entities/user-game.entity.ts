import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Game } from './game.entity';
import { Platform } from './platform.entity';
import { PlaySession } from './play-session.entity';
import { CustomTag } from './custom-tag.entity';
import { Achievement } from './achievement.entity';

export type GameStatus = 'backlog' | 'up_next' | 'playing' | 'completed' | 'finished' | 'dropped' | 'wishlist' | 'on_hold';

@Entity('user_games')
@Unique(['user', 'game', 'platform'])
export class UserGame {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => User, (user) => user.userGames, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Index()
  @ManyToOne(() => Game, (game) => game.userGames, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game: Game;

  @Column({ name: 'game_id' })
  gameId: number;

  @Index()
  @ManyToOne(() => Platform, (platform) => platform.userGames)
  @JoinColumn({ name: 'platform_id' })
  platform: Platform;

  @Column({ name: 'platform_id' })
  platformId: number;

  @Index()
  @Column({ length: 20, default: 'backlog' })
  status: GameStatus;

  @Index()
  @Column({ type: 'smallint', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  review?: string;

  @Column({ name: 'total_playtime_mins', default: 0 })
  totalPlaytimeMins: number;

  @Column({ name: 'steam_app_id', nullable: true })
  steamAppId?: number;

  @Column({ name: 'date_added', type: 'timestamp', default: () => 'NOW()' })
  dateAdded: Date;

  @Column({ name: 'date_started', type: 'timestamp', nullable: true })
  dateStarted?: Date;

  @Column({ name: 'date_completed', type: 'timestamp', nullable: true })
  dateCompleted?: Date;

  @Column({ name: 'last_played_at', type: 'timestamp', nullable: true })
  lastPlayedAt?: Date;

  @Column({ name: 'skipped_until', type: 'timestamp', nullable: true })
  skippedUntil?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PlaySession, (session) => session.userGame)
  sessions: PlaySession[];

  @ManyToMany(() => CustomTag, (tag) => tag.userGames)
  @JoinTable({
    name: 'user_game_tags',
    joinColumn: { name: 'user_game_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: CustomTag[];

  @OneToMany(() => Achievement, (achievement) => achievement.userGame)
  achievements: Achievement[];
}

