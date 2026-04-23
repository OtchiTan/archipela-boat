import { ApEvent } from 'src/ap-events/ap-events.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApPlayer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  discord_id!: string;

  @Column()
  yaml!: string;

  @Column({ nullable: true })
  apworld?: string;

  @Column({ nullable: true })
  slot?: string;

  @Column({ default: 0 })
  deathlinkCount!: number;

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.players)
  event!: ApEvent;
}
