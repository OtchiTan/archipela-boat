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
import { SetupApDto } from './dto/setup-ap.dto';

@Injectable()
export class SetupApCommand {
  constructor(
    @Inject() private apEventsService: ApEventsService,
    @Inject() private apMessagesService: ApMessagesService,
  ) {}

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
      const apMessage = new ApMessages();
      apMessage.message_id = result.resource?.message?.id ?? '';
      apMessage.event = event;
      await this.apMessagesService.createMessage(apMessage);
    }
  }
}
