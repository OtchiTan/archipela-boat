import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterCommand {
  constructor(
    @Inject() private apPlayersService: ApPlayersService,
    @Inject() private apEventsService: ApEventsService,
  ) {}

  @SlashCommand({
    name: 'register',
    description: 'Enregistre tes mondes pour le prochain archipelago',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() options: RegisterDto,
  ) {
    // Check if file is a yaml file
    if (!options.yaml.name.endsWith('.yaml')) {
      return interaction.reply({
        content:
          "Le fichier fourni n'est pas un fichier yaml. Veuillez fournir un fichier yaml.",
        ephemeral: true,
      });
    }

    // Check if apworld file is provided and if it is a apworld file
    if (options.apworld && !options.apworld.name.endsWith('.apworld')) {
      return interaction.reply({
        content:
          "Le fichier apworld fourni n'est pas un fichier apworld. Veuillez fournir un fichier .apworld valide.",
        ephemeral: true,
      });
    }

    const event = await this.apEventsService.findEvent({
      channelId: interaction.channelId,
    });

    if (event === null) {
      return interaction.reply({
        content: 'Aucun événement trouvé pour ce channel.',
        ephemeral: true,
      });
    }

    // Save the files to the database
    const player = await this.apPlayersService.create({
      discord_id: interaction.user.id,
      yaml: options.yaml.url,
      apworld: options.apworld?.url,
      eventId: event.id,
    });

    event.players?.push(player);
    await this.apEventsService.updateEvent(event.id, event);

    return interaction.reply({
      content: 'Mondes enregistrés! + ' + options.yaml?.name,
    });
  }
}
