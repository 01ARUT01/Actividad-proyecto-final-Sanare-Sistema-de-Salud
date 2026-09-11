import { Doctor, CreateDoctorData, UpdateDoctorData, Specialty } from '../types/doctor';
import { tt } from '../i18n';
import { API_URL, readErrorMessage, ApiError } from './apiConfig';

class DoctorService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getAll(specialtyId?: string): Promise<Doctor[]> {
    const url = specialtyId
      ? `${API_URL}/doctors?specialtyId=${specialtyId}`
      : `${API_URL}/doctors`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorGetDoctors')), response.status);
    }

    return response.json();
  }

  async getOne(id: string): Promise<Doctor> {
    const response = await fetch(`${API_URL}/doctors/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorGetDoctor')), response.status);
    }

    return response.json();
  }

  async create(data: CreateDoctorData): Promise<Doctor> {
    const response = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorCreate')), response.status);
    }

    return response.json();
  }

  async update(id: string, data: UpdateDoctorData): Promise<Doctor> {
    const response = await fetch(`${API_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorUpdate')), response.status);
    }

    return response.json();
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/doctors/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorDelete')), response.status);
    }
  }

  async getSpecialties(): Promise<Specialty[]> {
    const response = await fetch(`${API_URL}/specialties`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorGetSpecialties')), response.status);
    }

    return response.json();
  }

  async getAvailableSlots(
    doctorId: string,
    date: Date,
  ): Promise<{ id: string; startTime: string; endTime: string; durationMinutes: number }[]> {
    // Fecha YYYY-MM-DD en zona LOCAL (evita corrimientos por UTC en husos positivos)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const response = await fetch(`${API_URL}/doctors/${doctorId}/available-slots?date=${dateStr}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new ApiError(await readErrorMessage(response, tt('doctor.errorGetSlots')), response.status);
    }

    return response.json();
  }
}

export const doctorService = new DoctorService();