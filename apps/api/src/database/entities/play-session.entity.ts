import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserGame } from './user-game.entity';

@Entity('play_sessions')
export class PlaySession {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => UserGame, (userGame) => userGame.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_game_id' })
  userGame: UserGame;

  @Column({ name: 'user_game_id' })
  userGameId: number;

  @Index()
  @Column({ name: 'session_date', type: 'date' })
  sessionDate: Date;

  @Column({ name: 'duration_mins' })
  durationMins: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

