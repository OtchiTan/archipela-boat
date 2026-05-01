import { ApDeathlink } from 'src/ap-deathlinks/ap-deathlinks.entity';
import { ApEvent } from 'src/ap-events/ap-events.entity';
import { ApPlayer } from 'src/ap-players/ap-players.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @Column({ default: false })
  isCoreGame: boolean = false;

  @ManyToOne(() => ApEvent, (event) => event.games)
  event!: ApEvent;

  @ManyToOne(() => ApPlayer, (player) => player.games)
  player!: ApPlayer;

  @OneToMany(() => ApDeathlink, (deathlink) => deathlink.game)
  @JoinColumn()
  deathlinks!: ApDeathlink[];
}
