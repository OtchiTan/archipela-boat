import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ApClient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  url!: string;

  @Column()
  slot!: string;

  @Column({ nullable: true })
  startTime?: Date;

  @Column({ nullable: true })
  endTime?: Date;
}
