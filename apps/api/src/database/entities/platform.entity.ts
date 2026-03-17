import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserGame } from './user-game.entity';

@Entity('platforms')
export class Platform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'igdb_id', nullable: true, unique: true })
  igdbId?: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  slug?: string;

  @Column({ length: 20, nullable: true })
  abbreviation?: string;

  @Column({ length: 50, nullable: true })
  category?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => UserGame, (userGame) => userGame.platform)
  userGames: UserGame[];
}

