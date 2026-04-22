import { ApEvent } from 'src/ap-events/entities/ap-events.entity';
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

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.players)
  event!: ApEvent;
}
