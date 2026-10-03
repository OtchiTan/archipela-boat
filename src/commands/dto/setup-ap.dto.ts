import { Role, type Channel } from 'discord.js';
import { ChannelOption, RoleOption, StringOption } from 'necord';

export class ConfigApDto {
  @StringOption({
    name: 'name',
    description: "Le nom de l'évènement",
    required: true,
  })
  name!: string;

  @ChannelOption({
    name: 'logs-channel',
    description: 'Le channel de logs classique (deathlinks, etc...)',
    required: false,
  })
  logsChannel?: Channel;

  @ChannelOption({
    name: 'admin-logs-channel',
    description: 'Le channel de logs admin (nouvelle inscription, etc...)',
    required: false,
  })
  adminLogsChannel?: Channel;

  @RoleOption({
    name: 'top-deathlink-role',
    description:
      'Le role à assigner à la personne ayant tuer le plus de personne via deathlinks',
    required: false,
  })
  topDeathlinkRole?: Role;
}
