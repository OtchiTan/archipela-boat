import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { ApEvent } from 'src/ap-events/entities/ap-events.entity';

@Table({ tableName: 'ap_clients' })
export class ApPlayer extends Model {
  @Column
  discord_id!: string;

  @Column
  yaml!: string;

  @Column({ allowNull: true })
  apworld?: string;

  @ForeignKey(() => ApEvent)
  @Column
  eventId!: number;

  @BelongsTo(() => ApEvent)
  event!: ApEvent;
}
