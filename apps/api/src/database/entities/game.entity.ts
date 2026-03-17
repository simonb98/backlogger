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

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'igdb_id', unique: true })
  igdbId: number;

  @Index()
  @Column({ length: 500 })
  name: string;

  @Column({ length: 500, nullable: true })
  slug?: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  storyline?: string;

  @Column({ name: 'cover_url', length: 1000, nullable: true })
  coverUrl?: string;

  @Column({ name: 'screenshot_urls', type: 'text', array: true, nullable: true })
  screenshotUrls?: string[];

  @Column({ name: 'release_date', type: 'timestamp', nullable: true })
  releaseDate?: Date;

  @Column({ type: 'varchar', length: 100, array: true, nullable: true })
  genres?: string[];

  @Column({ type: 'varchar', length: 100, array: true, nullable: true })
  themes?: string[];

  @Column({ name: 'game_modes', type: 'varchar', length: 100, array: true, nullable: true })
  gameModes?: string[];

  @Column({ length: 255, nullable: true })
  developer?: string;

  @Column({ length: 255, nullable: true })
  publisher?: string;

  @Column({ name: 'igdb_rating', type: 'decimal', precision: 4, scale: 2, nullable: true })
  igdbRating?: number;

  @Column({ name: 'igdb_rating_count', nullable: true })
  igdbRatingCount?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserGame, (userGame) => userGame.game)
  userGames: UserGame[];
}

