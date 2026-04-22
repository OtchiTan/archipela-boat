import { ApPlayer } from 'src/ap-players/entities/ap-players.entity';
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
  channelId!: string;

  @Column({ nullable: true })
  messageId?: string;

  @Column({ nullable: true })
  startTime?: Date;

  @Column({ nullable: true })
  endTime?: Date;

  @OneToMany(() => ApPlayer, (apPlayer) => apPlayer.event)
  @JoinColumn()
  players!: ApPlayer[];
}
