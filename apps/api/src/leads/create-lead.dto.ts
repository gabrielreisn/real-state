import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimToUndefined = ({ value }: { value: unknown }) => {
  const trimmed = trim({ value });
  return trimmed === '' ? undefined : trimmed;
};

export class CreateLeadDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  // Brazilian numbers with area code: 10 or 11 digits, with or without the +55 prefix and punctuation.
  @Transform(trim)
  @IsString()
  @Matches(/^\+?[\d\s().-]{10,30}$/)
  phone!: string;

  @Transform(trimToUndefined)
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @Transform(trimToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  propertyCode?: string;
}
