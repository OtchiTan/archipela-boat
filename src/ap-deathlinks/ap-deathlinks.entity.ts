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
  killcount: number = 0;

  @ManyToOne(() => ApGame, (apGame) => apGame.deathlinks)
  game!: ApGame;
}
