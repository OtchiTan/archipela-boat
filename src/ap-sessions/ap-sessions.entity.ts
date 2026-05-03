import { ApGame } from 'src/ap-games/ap-games.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  start!: Date;

  @Column({ nullable: true })
  end?: Date;

  @Column({ default: false })
  deathlink: boolean = false;

  @ManyToOne(() => ApGame, (game) => game.sessions)
  game!: ApGame;
}
