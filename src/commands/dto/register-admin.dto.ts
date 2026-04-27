import { User } from 'discord.js';
import { UserOption } from 'necord';
import { RegisterDto } from './register.dto';

export class RegisterAdminDto extends RegisterDto {
  @UserOption({
    name: 'user',
    description: 'Le user que tu veux register',
    required: true,
  })
  user!: User;
}
