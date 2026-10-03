import { Inject, Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApMessages } from 'src/ap-messages/ap-messages.entity';
import { ApMessagesService } from 'src/ap-messages/ap-messages.service';
import { IsNull } from 'typeorm';
import { ConfigApDto } from './dto/setup-ap.dto';

@Injectable()
export class ConfigApCommand {
  constructor(
    @Inject() private apEventsService: ApEventsService,
    @Inject() private apMessagesService: ApMessagesService,
  ) {}

  @SlashCommand({
    name: 'config-ap',
    description: 'Démarre ou paramètres un Archipelago dans ce channel',
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupAp(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: ConfigApDto,
  ) {
    if (interaction.guildId === null) {
      return await interaction.reply({
        flags: 'Ephemeral',
        content: 'Cette commande doit être executé sur un serveur discord',
      });
    }

    const alreadyExistingEvent = await this.apEventsService.findEvent({
      guildId: interaction.guildId,
      endTime: IsNull(),
    });

    if (alreadyExistingEvent) {
      await this.apEventsService.updateEvent(alreadyExistingEvent.id, {
        name: options.name,
        logChannelId: options.logsChannel?.id,
        adminLogChannelId: options.adminLogsChannel?.id,
        topDeathlinkRoleId: options.topDeathlinkRole?.id,
      });

      if (
        alreadyExistingEvent.url &&
        alreadyExistingEvent.startTime &&
        alreadyExistingEvent.endTime == null
      ) {
        await this.apEventsService.startNewApClient(
          alreadyExistingEvent.id,
          true,
        );
      }

      return await interaction.reply({
        flags: 'Ephemeral',
        content: "L'évènement à bien été mis à jour",
      });
    }

    const event = await this.apEventsService.createEvent({
      channelId: interaction.channelId,
      guildId: interaction.guildId,
      name: options.name,
      logChannelId: options.logsChannel?.id,
      adminLogChannelId: options.adminLogsChannel?.id,
      topDeathlinkRoleId: options.topDeathlinkRole?.id,
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
      const apMessage = new ApMessages();
      apMessage.message_id = result.resource?.message?.id ?? '';
      apMessage.event = event;
      await this.apMessagesService.createMessage(apMessage);
    }
  }
}
