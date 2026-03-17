import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SteamImportDto {
  @ApiProperty({
    description: 'Steam profile URL, Steam ID, or vanity name',
    example: 'https://steamcommunity.com/id/yourname',
  })
  @IsString()
  @IsNotEmpty()
  steamId: string;
}

