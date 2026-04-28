import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApGame {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column()
  yaml!: string;

  @Column({ nullable: true })
  apworld?: string;

  @Column()
  slot!: string;

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.games)
  event!: ApEvent;

  @Column()
  lineId: number = -1;

  @Column({ default: 0 })
  deathlinkCount!: number;

  @ManyToOne(() => ApPlayer, (apPlayer) => apPlayer.games)
  player!: ApPlayer;
}
