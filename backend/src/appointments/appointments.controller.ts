import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from '@prisma/client';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';
import { AppointmentEntity } from './entities/appointment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '@prisma/client';
import { UserEntity } from '../auth/entities/user.entity';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener turnos (Admin o propios del paciente)' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiResponse({ status: 200, description: 'Lista de turnos', type: [AppointmentEntity] })
  findAll(
    @Query('status') status?: AppointmentStatus,
    @GetUser() user?: UserEntity,
  ) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.DOCTOR) {
      return this.appointmentsService.findAll(status);
    }

    return this.appointmentsService.findAll(status, user.id);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de turnos (solo Admin)' })
  @ApiResponse({ status: 200, description: 'Estadísticas' })
  getStats() {
    return this.appointmentsService.getStats();
  }

  @Get('waiting-list')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener lista de espera activa (solo Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de espera actual' })
  getWaitingList() {
    return this.appointmentsService.getWaitingList();
  }

  @Post('waiting-list')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Agregar una persona a la lista de espera' })
  @ApiResponse({ status: 201, description: 'Persona agregada a la lista de espera' })
  createWaitingList(
    @Body() createDto: CreateWaitingListDto,
    @GetUser() user: UserEntity,
  ) {
    void user;
    return this.appointmentsService.createWaitingList(createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un turno por ID' })
  @ApiResponse({ status: 200, description: 'Turno encontrado', type: AppointmentEntity })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: UserEntity,
  ) {
    const appointment = await this.appointmentsService.findOne(id);
    this.assertCanAccess(user, appointment);
    return appointment;
  }

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Crear un nuevo turno (solo Pacientes)' })
  @ApiResponse({ status: 201, description: 'Turno creado', type: AppointmentEntity })
  @ApiResponse({ status: 400, description: 'Horario no disponible' })
  create(
    @Body() createDto: CreateAppointmentDto,
    @GetUser() user: UserEntity,
  ) {
    return this.appointmentsService.create({
      ...createDto,
      date: new Date(createDto.date),
      userId: user.id,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancelar un turno (Admin o propio)' })
  @ApiResponse({ status: 200, description: 'Turno cancelado' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  async cancel(
    @Param('id') id: string,
    @GetUser() user: UserEntity,
  ) {
    const appointment = await this.appointmentsService.findOne(id);
    this.assertCanAccess(user, appointment);
    return this.appointmentsService.cancel(id);
  }

  private assertCanAccess(
    user: UserEntity,
    appointment: { userId: string | null },
  ): void {
    if (user.role === UserRole.ADMIN) return;
    if (appointment.userId && appointment.userId === user.id) return;
    throw new ForbiddenException('No tienes permiso para acceder a este turno');
  }
}

// Controlador público sin autenticación para cancelación por email
@ApiTags('appointments-public')
@Controller('appointments-public')
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('token/:token')
  @ApiOperation({ summary: 'Obtener detalles de turno por token (público)' })
  @ApiResponse({ status: 200, description: 'Turno encontrado', type: AppointmentEntity })
  @ApiResponse({ status: 400, description: 'Token inválido' })
  getByToken(@Param('token') token: string) {
    return this.appointmentsService.getByToken(token);
  }

  @Post('cancel/:token')
  @ApiOperation({ summary: 'Cancelar turno por token (público)' })
  @ApiResponse({ status: 200, description: 'Turno cancelado exitosamente' })
  @ApiResponse({ status: 400, description: 'Token inválido o turno ya cancelado' })
  cancelByToken(@Param('token') token: string) {
    return this.appointmentsService.cancelByToken(token);
  }
}
