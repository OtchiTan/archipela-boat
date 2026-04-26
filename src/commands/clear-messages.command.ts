import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';

@Injectable()
export class ClearMessagesCommand {
  constructor(
    @Inject() private apPlayersService: ApPlayersService,
    @Inject() private apEventsService: ApEventsService,
    private readonly httpService: HttpService,
  ) {}

  @SlashCommand({
    name: 'clear-messages',
    description: 'Slurp',
    defaultMemberPermissions: 'Administrator',
  })
  public async onRegister(@Context() [interaction]: SlashCommandContext) {
    const messages = await interaction.channel?.messages.fetch({});
    if (!messages) {
      return;
    }

    for (const [, message] of messages) {
      if (message.author.bot) {
        await message.delete();
      }
    }

    return await interaction.reply({
      flags: 'Ephemeral',
      content: 'c propre',
    });
  }
}
