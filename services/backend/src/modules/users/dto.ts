import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { Gender } from "@vibely/types";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString({ each: true })
  interests?: string[];
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  preferredGender?: string;

  @IsOptional()
  preferredAgeMin?: number;

  @IsOptional()
  preferredAgeMax?: number;

  @IsOptional()
  @IsString({ each: true })
  preferredCountries?: string[];

  @IsOptional()
  @IsString({ each: true })
  preferredLanguages?: string[];
}

export class UpdateAvatarDto {
  @IsString()
  avatarUrl: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
