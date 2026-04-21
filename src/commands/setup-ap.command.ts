import { Inject, Injectable } from '@nestjs/common';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import {
  Button,
  type ButtonContext,
  ComponentParam,
  Context,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';

@Injectable()
export class SetupApCommand {
  constructor(@Inject() private apEventsService: ApEventsService) {}

  @SlashCommand({
    name: 'setup-ap',
    description: 'Démarre un paramètres un Archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupAp(@Context() [interaction]: SlashCommandContext) {
    const event = await this.apEventsService.createEvent(interaction.channelId);

    const start = new ButtonBuilder()
      .setCustomId('start/' + event?.id)
      .setLabel('Start')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(start);

    const result = await interaction.reply({
      content: `Nouvel événement créé dans ce channel <#${event?.channelId}>`,
      components: [row],
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
    const event = await this.apEventsService.getEventById(eventId);

    if (event !== null) {
      event.startTime = new Date();

      await this.apEventsService.updateEvent(eventId, event);

      await interaction.reply({
        content: `Lancement de l'événement ${eventId}`,
      });
    }
  }
}
