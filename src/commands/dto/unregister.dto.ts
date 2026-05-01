import { StringOption } from 'necord';

export class UnregisterDto {
  @StringOption({
    name: 'slot',
    description: 'Entre le nom du slot que tu cherche à supprimer',
    required: true,
  })
  slot!: string;
}
