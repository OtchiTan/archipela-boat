import { StringOption } from 'necord';

export class SetupApDto {
  @StringOption({
    name: 'name',
    description: "Le nom de l'évènement",
    required: true,
  })
  name!: string;
}
