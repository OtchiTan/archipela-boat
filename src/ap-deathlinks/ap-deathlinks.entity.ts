import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApGame } from 'src/ap-games/ap-games.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApDeathlink {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  timestamp!: Date;

  @Column({ nullable: true })
  cause?: string;

  @Column({ default: 0 })
  killCount: number = 0;

  @Column({ default: '' })
  slot!: string;

  @ManyToOne(() => ApEvent, (apEvent) => apEvent.deathlinks)
  event!: ApEvent;

  @ManyToOne(() => ApGame, (apGame) => apGame.deathlinks)
  game?: ApGame;
}
