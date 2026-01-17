import { IsOptional, IsString, IsIn } from 'class-validator';

const SUPPORTED_LANGUAGES = [
  'javascript',
  'python',
  'java',
  'cpp',
  'c',
  'php',
  'ruby',
  'go',
  'rust',
  'kotlin',
  'swift',
  'typescript',
];

export class CreateRoomDto {
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: string;

  @IsOptional()
  @IsString()
  initialCode?: string;
}

export class UpdateCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES)
  language?: string;
}
