import { Attachment } from 'discord.js';
import { AttachmentOption } from 'necord';

export class RegisterDto {
  @AttachmentOption({
    name: 'yaml',
    description: 'Met ton fichier yaml ici',
    required: true,
  })
  yaml!: Attachment;

  @AttachmentOption({
    name: 'apworld',
    description: 'Met ton fichier apworld ici',
    required: false,
  })
  apworld: Attachment | undefined;
}
