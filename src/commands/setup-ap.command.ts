import { Inject, Injectable } from '@nestjs/common';
import { EmbedBuilder } from 'discord.js';
import {
  Button,
  type ButtonContext,
  ComponentParam,
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
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
    const event = await this.apEventsService.createEvent({
      channelId: interaction.channelId,
      name: options.name,
    });

    const result = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`:island: ${options.name} :island:`)
          .setColor(0x000000)
          .setTimestamp(new Date())
          .setDescription(`:busts_in_silhouette: 0 personne inscrite`),
      ],
    });

    if (event !== null) {
      event.messageId = result.id;
      await this.apEventsService.updateEvent(event.id, event);
    }
  }

  @Button('start/:eventId')
  public async onButtonStart(
    @Context() [interaction]: ButtonContext,
    @ComponentParam('eventId') eventId: number,
  ) {
    const event = await this.apEventsService.findEvent({ id: eventId });

    if (event !== null) {
      event.startTime = new Date();

      await this.apEventsService.updateEvent(eventId, event);

      await interaction.reply({
        content: `Lancement de l'événement ${eventId}`,
      });
    }
  }
}
