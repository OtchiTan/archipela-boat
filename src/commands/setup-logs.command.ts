import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { IsNull } from 'typeorm';
import { SetupLogsDto } from './dto/setup-logs.dto';

@Injectable()
export class SetupLogsCommand {
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'setup-logs',
    description: "Défini le channel de logs de l'évènement",
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupLogs(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: SetupLogsDto,
  ) {
    const event = await this.apEventsService.findEvent({
      name: options.name,
      endTime: IsNull(),
    });

    if (!event) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: "L'évènement n'existe pas",
      });
    }

    event.logChannelId = interaction.channelId;

    await this.apEventsService.updateEvent(event.id, {
      ...event,
      games: undefined,
      players: undefined,
      messages: undefined,
    });

    return await interaction.reply({
      flags: 'Ephemeral',
      content: 'Le channel à bien été défini en tant que channel de logs',
    });
  }
}
