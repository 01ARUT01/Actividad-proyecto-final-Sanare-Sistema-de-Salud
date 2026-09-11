import { AppointmentWithDetails, WaitingListEntry } from '../types/doctor';
import { tt } from '../i18n';
import { API_URL, readErrorMessage, ApiError } from './apiConfig';

class AppointmentService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private isDemoSession(): boolean {
    return !!localStorage.getItem('token')?.startsWith('demo-');
  }

  private getDemoAppointments(): AppointmentWithDetails[] {
    const raw = localStorage.getItem('demoAppointments');

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as AppointmentWithDetails[];
    } catch {
      return [];
    }
  }

  private saveDemoAppointments(appointments: AppointmentWithDetails[]): void {
    localStorage.setItem('demoAppointments', JSON.stringify(appointments));
  }

  private getDemoWaitingList(): WaitingListEntry[] {
    const raw = localStorage.getItem('demoWaitingList');

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as WaitingListEntry[];
    } catch {
      return [];
    }
  }

  private saveDemoWaitingList(entries: WaitingListEntry[]): void {
    localStorage.setItem('demoWaitingList', JSON.stringify(entries));
  }

  async getAll(status?: string): Promise<AppointmentWithDetails[]> {
    if (this.isDemoSession()) {
      const appointments = this.getDemoAppointments();

      if (status) {
        return appointments.filter((appointment) => appointment.status === status);
      }

      return appointments;
    }

    const url = status
      ? `${API_URL}/appointments?status=${status}`
      : `${API_URL}/appointments`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('appt.errorGet')), response.status);
    }

    return response.json();
  }

  async getWaitingList(): Promise<WaitingListEntry[]> {
    if (this.isDemoSession()) {
      return this.getDemoWaitingList();
    }

    const response = await fetch(`${API_URL}/appointments/waiting-list`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('appt.errorGet')), response.status);
    }

    return response.json();
  }

  async createWaitingList(data: {
    specialtyId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone: string;
  }): Promise<WaitingListEntry> {
    if (this.isDemoSession()) {
      const entries = this.getDemoWaitingList();
      const entry: WaitingListEntry = {
        id: `demo-waiting-${Date.now()}`,
        specialtyId: data.specialtyId,
        patientName: data.patientName,
        patientEmail: data.patientEmail ?? null,
        patientPhone: data.patientPhone,
        createdAt: new Date().toISOString(),
        notified: false,
      };

      this.saveDemoWaitingList([entry, ...entries]);
      return entry;
    }

    const response = await fetch(`${API_URL}/appointments/waiting-list`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('appt.errorCreate')), response.status);
    }

    return response.json();
  }

  async getByDate(date: Date): Promise<AppointmentWithDetails[]> {
    const appointments = await this.getAll();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfDay && aptDate <= endOfDay;
    });
  }

  async cancel(id: string): Promise<void> {
    if (this.isDemoSession()) {
      const appointments = this.getDemoAppointments().filter((appointment) => appointment.id !== id);
      this.saveDemoAppointments(appointments);
      return;
    }

    const response = await fetch(`${API_URL}/appointments/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('appt.errorCancel')), response.status);
    }
  }

  async create(data: {
    doctorId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone: string;
    date: string;
    notes?: string;
  }): Promise<AppointmentWithDetails> {
    if (this.isDemoSession()) {
      const demoAppointments = this.getDemoAppointments();
      const now = new Date();
      const demoAppointment: AppointmentWithDetails = {
        id: `demo-${Date.now()}`,
        doctorId: data.doctorId,
        userId: 'demo-user',
        patientName: data.patientName,
        patientEmail: data.patientEmail ?? null,
        patientPhone: data.patientPhone,
        date: data.date,
        notes: data.notes ?? null,
        status: 'CONFIRMED',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      this.saveDemoAppointments([demoAppointment, ...demoAppointments]);
      return demoAppointment;
    }

    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('appt.errorCreate')), response.status);
    }

    return response.json();
  }
}

export const appointmentService = new AppointmentService();