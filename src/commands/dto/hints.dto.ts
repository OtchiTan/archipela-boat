import { StringOption } from 'necord';

export class HintsDto {
  @StringOption({
    name: 'slot',
    description: "Le slot affiché dans l'archipelago",
    required: false,
  })
  slot!: string | null;
}
