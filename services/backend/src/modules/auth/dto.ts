import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { Gender } from "@vibely/types";

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/[a-zA-Z]/)
  @Matches(/[0-9]/)
  password: string;

  @IsString()
  @IsNotEmpty()
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  language: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
