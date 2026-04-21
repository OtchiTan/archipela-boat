import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { SetupApDto } from './dto/setup-ap.dto';

@Injectable()
export class SetupApCommand {
  constructor(@Inject() private apPlayersService: ApPlayersService) {}

  @SlashCommand({
    name: 'setup-archi',
    description: 'Démarre un paramètres un Archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupAp(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: SetupApDto,
  ) {
    return interaction.reply({
      content: 'Cette commande est en cours de développement.',
      embeds: [
        {
          description:
            'En attendant, tu peux utiliser la commande /register pour enregistrer tes mondes.',
        },
      ],
      ephemeral: false,
    });
  }
}
