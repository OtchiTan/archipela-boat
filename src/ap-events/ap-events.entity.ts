import { ApGame } from 'src/ap-games/ap-games.entity';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  channelId!: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  startTime?: Date;

  @Column({ nullable: true })
  endTime?: Date;

  @Column({ default: false })
  clientConnected: boolean = false;

  @OneToMany(() => ApPlayer, (apPlayer) => apPlayer.event)
  @JoinColumn()
  players!: ApPlayer[];

  @OneToMany(() => ApGame, (apGame) => apGame.event)
  @JoinColumn()
  games!: ApGame[];
}
