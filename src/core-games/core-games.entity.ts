import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CoreGame {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;
}
