import { Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ArchiClientsService } from 'src/ap-players/ap-players.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterCommand {
  constructor(@Inject() private archiClientsService: ArchiClientsService) {}

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
    if (
      options.apworld !== undefined &&
      !options.apworld.name.endsWith('.apworld')
    ) {
      return interaction.reply({
        content:
          "Le fichier apworld fourni n'est pas un fichier apworld. Veuillez fournir un fichier .apworld valide.",
        ephemeral: true,
      });
    }

    // Save the files to the database
    await this.archiClientsService.create({
      discord_id: interaction.user.id,
      yaml: options.yaml.url,
      apworld: options.apworld?.url,
    });

    return interaction.reply({
      content: 'Mondes enregistrés! + ' + options.yaml?.name,
    });
  }
}
