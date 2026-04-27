import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { ApGamesService } from 'src/ap-games/ap-games.service';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class RegisterAdminCommand {
  constructor(
    @Inject(forwardRef(() => ApGamesService))
    private apGamesService: ApGamesService,
  ) {}

  @SlashCommand({
    name: 'register-admin',
    description: 'Enregistre tes mondes pour le prochain archipelago',
    defaultMemberPermissions: 'Administrator',
  })
  public async onRegister(
    @Context() [interaction]: SlashCommandContext,
    @Options() registerDto: RegisterAdminDto,
  ) {
    return await this.apGamesService.onRegister(
      [interaction],
      registerDto,
      registerDto.user.id,
      registerDto.user.displayName,
    );
  }
}
