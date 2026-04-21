import { Column, HasMany, Model, Table } from 'sequelize-typescript';
import { ApPlayer } from 'src/ap-players/entities/ap-players.entity';

@Table({ tableName: 'ap_events' })
export class ApEvent extends Model {
  @Column
  channelId!: string;

  @Column
  messageId!: string;

  @Column
  startTime?: Date;

  @Column
  endTime?: Date;

  @HasMany(() => ApPlayer)
  players!: ApPlayer[];
}
