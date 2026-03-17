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
import { Game } from './game.entity';
import { Platform } from './platform.entity';
import { PlaySession } from './play-session.entity';
import { CustomTag } from './custom-tag.entity';

export type GameStatus = 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist' | 'on_hold';

@Entity('user_games')
@Unique(['game', 'platform'])
export class UserGame {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ name: 'completion_percent', type: 'smallint', default: 0 })
  completionPercent: number;

  @Column({ name: 'total_playtime_mins', default: 0 })
  totalPlaytimeMins: number;

  @Column({ name: 'date_added', type: 'timestamp', default: () => 'NOW()' })
  dateAdded: Date;

  @Column({ name: 'date_started', type: 'timestamp', nullable: true })
  dateStarted?: Date;

  @Column({ name: 'date_completed', type: 'timestamp', nullable: true })
  dateCompleted?: Date;

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
}

