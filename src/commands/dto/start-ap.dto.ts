import { StringOption } from 'necord';

export class StartApDto {
  @StringOption({
    name: 'url',
    description: "L'url du serveur archipelago'",
    required: true,
  })
  url!: string;
}
