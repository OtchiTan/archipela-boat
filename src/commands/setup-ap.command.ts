import { Inject, Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { IsNull } from 'typeorm';
import { SetupApDto } from './dto/setup-ap.dto';

@Injectable()
export class SetupApCommand {
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'setup-ap',
    description: 'Démarre un paramètres un Archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupAp(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: SetupApDto,
  ) {
    const alreadyExistingEvent = await this.apEventsService.findEvent({
      channelId: interaction.channelId,
      endTime: IsNull(),
    });

    if (alreadyExistingEvent) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Un événement à déjà commencé dans ce channel',
      });
    }

    const event = await this.apEventsService.createEvent({
      channelId: interaction.channelId,
      name: options.name,
    });

    const result = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🏝️ ${options.name} 🏝️`)
          .setColor(0x4287f5)
          .setTimestamp(new Date())
          .setDescription(`👥 0 joueur·ses - 🎮 0 jeux`),
      ],
      withResponse: true,
    });

    if (event !== null) {
      event.messageId = result.resource?.message?.id;
      await this.apEventsService.updateEvent(event.id, event);
    }
  }
}
