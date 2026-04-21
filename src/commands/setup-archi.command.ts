import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ArchiClientsService } from 'src/ap-players/ap-players.service';
import { SetupArchiDto } from './dto/setup-archi.dto';

@Injectable()
export class SetupArchiCommand {
  constructor(@Inject() private archiClientsService: ArchiClientsService) {}

  @SlashCommand({
    name: 'setup-archi',
    description: 'Démarre un paramètres un Archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onSetupArchi(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: SetupArchiDto,
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
