import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AppointmentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  async findAll(status?: AppointmentStatus, userId?: string) {
    const result = await this.prisma.appointment.findMany({
      where: { ...(status ? { status } : {}), ...(userId ? { userId } : {}) },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
      orderBy: { date: 'desc' },
    });
    return result.map((appointment) => this.stripCancellationToken(appointment));
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    return this.stripCancellationToken(appointment);
  }

  async create(data: {
    doctorId: string;
    userId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone: string;
    date: Date;
    notes?: string;
  }) {
    // Generar token de cancelación único
    const cancellationToken = crypto.randomBytes(32).toString('hex');

    // Usar transacción para evitar race condition
    // Esto garantiza que verificar y marcar el slot sea atómico
    const appointment = await this.prisma.$transaction(async (tx) => {
      // Verificar que el horario esté disponible
      const slot = await tx.availableSlot.findFirst({
        where: {
          doctorId: data.doctorId,
          startTime: { lte: data.date },
          endTime: { gte: data.date },
          isBooked: false,
        },
      });

      if (!slot) {
        throw new BadRequestException('El horario seleccionado no está disponible');
      }

      // Marcar el slot como ocupado de forma ATÓMICA: solo gana la transacción
      // que logre marcar isBooked:true; cualquier competidora recibe count 0.
      const claimed = await tx.availableSlot.updateMany({
        where: { id: slot.id, isBooked: false },
        data: { isBooked: true },
      });

      if (claimed.count === 0) {
        throw new BadRequestException('El horario seleccionado no está disponible');
      }

      // Crear el turno dentro de la misma transacción
      const newAppointment = await tx.appointment.create({
        data: {
          ...data,
          status: AppointmentStatus.CONFIRMED,
          cancellationToken,
        },
        include: {
          doctor: {
            include: { specialty: true },
          },
        },
      });

      return newAppointment;
    });

    // Enviar email de confirmación (no bloqueante)
    if (appointment.patientEmail) {
      this.mailService
        .sendAppointmentConfirmation(
          appointment.patientEmail,
          appointment.patientName,
          appointment.doctor.name,
          appointment.doctor.specialty.name,
          appointment.date,
          appointment.doctor.hospital,
        )
        .catch((error) => {
          console.error('Error sending confirmation email:', error);
        });
    }

    // Encolar notificación
    await this.notificationQueue.add('appointment-confirmed', {
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      patientEmail: appointment.patientEmail,
      patientPhone: appointment.patientPhone,
      doctorName: appointment.doctor.name,
      specialty: appointment.doctor.specialty.name,
      date: appointment.date,
    });

    // Programar recordatorio para 24 horas antes
    const reminderTime = new Date(appointment.date);
    reminderTime.setHours(reminderTime.getHours() - 24);
    const delay = reminderTime.getTime() - Date.now();

    if (delay > 0 && appointment.patientEmail) {
      await this.notificationQueue.add(
        'appointment-reminder',
        {
          appointmentId: appointment.id,
          patientEmail: appointment.patientEmail,
          patientName: appointment.patientName,
          doctorName: appointment.doctor.name,
          specialty: appointment.doctor.specialty.name,
          date: appointment.date,
          hospital: appointment.doctor.hospital,
        },
        { delay },
      );
    }

    return this.stripCancellationToken(appointment);
  }

  /**
   * Elimina el cancellationToken de la respuesta: ese token es un secreto
   * que solo debe llegar al paciente vía email, nunca al cliente.
   */
  private stripCancellationToken<
    T extends { cancellationToken?: string },
  >(data: T): Omit<T, 'cancellationToken'> {
    const { cancellationToken: _removed, ...safe } = data;
    return safe;
  }

  async cancel(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Este turno ya fue cancelado');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar un turno completado');
    }

    if (appointment.date < new Date()) {
      throw new BadRequestException('No se puede cancelar un turno que ya pasó');
    }

    // Marcar turno como cancelado
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    // Liberar el slot
    await this.prisma.availableSlot.updateMany({
      where: {
        doctorId: appointment.doctorId,
        startTime: { lte: appointment.date },
        endTime: { gte: appointment.date },
      },
      data: { isBooked: false },
    });

    // Enviar email de cancelación (no bloqueante)
    if (updated.patientEmail) {
      this.mailService
        .sendAppointmentCancellation(
          updated.patientEmail,
          updated.patientName,
          updated.doctor.name,
          updated.doctor.specialty.name,
          updated.date,
        )
        .catch((error) => {
          console.error('Error sending cancellation email:', error);
        });
    }

    // Notificar a la lista de espera
    await this.notificationQueue.add('slot-available', {
      doctorId: appointment.doctorId,
      specialtyId: appointment.doctor.specialtyId,
      date: appointment.date,
    });

    return this.stripCancellationToken(updated);
  }

  async cancelByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!appointment) {
      throw new BadRequestException('Token de cancelación inválido');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Este turno ya fue cancelado');
    }

    // Verificar que el turno no haya pasado
    if (appointment.date < new Date()) {
      throw new BadRequestException('No se puede cancelar un turno que ya pasó');
    }

    // Cancelar usando el método existente
    return this.cancel(appointment.id);
  }

  async getByToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!appointment) {
      throw new BadRequestException('Token inválido');
    }

    return this.stripCancellationToken(appointment);
  }

  async getWaitingList() {
    return this.prisma.waitingList.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async createWaitingList(data: {
    specialtyId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone: string;
  }) {
    return this.prisma.waitingList.create({
      data: {
        specialtyId: data.specialtyId,
        patientName: data.patientName,
        patientEmail: data.patientEmail ?? null,
        patientPhone: data.patientPhone,
      },
    });
  }

  async getStats() {
    const total = await this.prisma.appointment.count();
    const confirmed = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CONFIRMED },
    });
    const pending = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.PENDING },
    });
    const cancelled = await this.prisma.appointment.count({
      where: { status: AppointmentStatus.CANCELLED },
    });

    return { total, confirmed, pending, cancelled };
  }
}
