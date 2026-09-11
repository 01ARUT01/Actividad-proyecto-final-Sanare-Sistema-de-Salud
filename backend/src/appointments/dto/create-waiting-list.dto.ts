import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, Matches } from 'class-validator';

export class CreateWaitingListDto {
  @ApiProperty({
    description: 'ID de la especialidad para la cual se desea entrar en lista de espera',
    example: 'specialty-uuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'La especialidad es requerida' })
  specialtyId: string;

  @ApiProperty({
    description: 'Nombre completo del paciente',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del paciente es requerido' })
  patientName: string;

  @ApiPropertyOptional({
    description: 'Email del paciente',
    example: 'juan.perez@email.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  patientEmail?: string;

  @ApiProperty({
    description: 'Teléfono del paciente',
    example: '+54 11 1234-5678',
  })
  @IsString()
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^[\d\s\+\-\(\)]+$/, { message: 'Formato de teléfono inválido' })
  patientPhone: string;
}
