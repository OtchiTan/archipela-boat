import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApEventsService } from 'src/ap-events/ap-events.service';
import { ApPlayersService } from 'src/ap-players/ap-players.service';
import { parse as yamlParse } from 'yaml';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class RegisterCommand {
  constructor(
    @Inject() private apPlayersService: ApPlayersService,
    @Inject() private apEventsService: ApEventsService,
    private readonly httpService: HttpService,
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

    const { data } = await this.httpService.axiosRef.get<string>(
      options.yaml.url,
    );

    const folderPath = `./.tmp/${event.id}/${interaction.user.id}/`;

    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }
    const filePath = `${folderPath}${options.yaml.name}`;

    const isExistingFile = existsSync(filePath);

    writeFileSync(filePath, data);

    const yaml = yamlParse(data) as Record<string, any>;

    if (isExistingFile) {
      const apPlayer = await this.apPlayersService.findOne({
        slot: yaml.name as string,
        event: event,
        discord_id: interaction.user.id,
      });

      apPlayer.apworld = options.apworld?.url;

      await this.apPlayersService.update(apPlayer.id, apPlayer);
    } else {
      // Save the files to the database
      await this.apPlayersService.create({
        discord_id: interaction.user.id,
        yaml: filePath,
        apworld: options.apworld?.url,
        event: event,
        slot: yaml.name as string,
      });
    }

    const message = await interaction.channel?.messages.fetch(event.messageId!);

    if (message) {
      console.log(message);
      const newEmbed = message.embeds[0];
      newEmbed.fields.push({
        name: interaction.user.username,
        value: 'Wouit',
      });
      await message.edit({ embeds: [newEmbed] });
    }

    return interaction.reply({
      content: 'Mondes enregistrés! + ' + options.yaml?.name,
    });
  }
}
