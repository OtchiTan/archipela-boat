import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApGame } from 'src/ap-games/ap-games.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ApPlayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  discord_id!: string;

  @Column()
  embedId: number = -1;

  @Column()
  fieldId: number = -1;

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.players)
  event!: ApEvent;

  @OneToMany(() => ApGame, (apGame) => apGame.player)
  @JoinColumn()
  games!: ApGame[];
}
