import { ApEvent } from 'src/ap-events/ap-events.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApMessages {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  message_id!: string;

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.players)
  event!: ApEvent;
}
