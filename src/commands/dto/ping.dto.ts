import { StringOption } from 'necord';

export class PingDto {
  @StringOption({
    name: 'slot',
    description: "Le slot affiché dans l'archipelago",
    required: true,
  })
  slot!: string;
}
