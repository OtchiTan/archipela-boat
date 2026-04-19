import { Column, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'archi_clients' })
export class ArchiClient extends Model {
  @Column
  discord_id!: string;

  @Column
  yaml!: string;

  @Column({ allowNull: true })
  apworld?: string;
}
