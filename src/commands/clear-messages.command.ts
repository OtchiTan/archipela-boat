import { Injectable } from '@nestjs/common';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';

@Injectable()
export class ClearMessagesCommand {
  constructor() {}

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
