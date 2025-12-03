import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface TherapistInvoice {
  id: string;
  therapist_id: string;
  invoice_number: string;
  file_url: string;
  amount: number;
  invoice_date: string;
  due_date?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  paid_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  therapist_name?: string;
  reviewed_by_name?: string;
}

export interface InvoiceStats {
  total_invoices: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  paid_count: number;
  pending_amount: number;
  approved_amount: number;
  paid_amount: number;
  total_amount: number;
}

export interface UploadInvoiceData {
  invoice_number: string;
  amount: number;
  invoice_date: string;
  due_date?: string;
  description?: string;
  notes?: string;
  invoice_file: File;
}

export const therapistInvoiceApi = {
  // Therapist endpoints
  async uploadInvoice(data: UploadInvoiceData): Promise<TherapistInvoice> {
    const formData = new FormData();
    formData.append('invoice_number', data.invoice_number);
    formData.append('amount', data.amount.toString());
    formData.append('invoice_date', data.invoice_date);
    if (data.due_date) formData.append('due_date', data.due_date);
    if (data.description) formData.append('description', data.description);
    if (data.notes) formData.append('notes', data.notes);
    formData.append('invoice_file', data.invoice_file);

    const response = await axios.post(`${API_URL}/therapist-invoices`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });

    return response.data.data;
  },

  async getMyInvoices(): Promise<TherapistInvoice[]> {
    const response = await axios.get(`${API_URL}/therapist-invoices/my-invoices`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  async getMyStats(): Promise<InvoiceStats> {
    const response = await axios.get(`${API_URL}/therapist-invoices/my-stats`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    await axios.delete(`${API_URL}/therapist-invoices/${invoiceId}`, {
      withCredentials: true,
    });
  },

  // Admin endpoints
  async getAllInvoices(filters?: {
    status?: string;
    therapist_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<TherapistInvoice[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.therapist_id) params.append('therapist_id', filters.therapist_id);
    if (filters?.from_date) params.append('from_date', filters.from_date);
    if (filters?.to_date) params.append('to_date', filters.to_date);

    const response = await axios.get(
      `${API_URL}/therapist-invoices/admin/all?${params.toString()}`,
      { withCredentials: true }
    );
    return response.data.data;
  },

  async getAllStats(): Promise<InvoiceStats> {
    const response = await axios.get(`${API_URL}/therapist-invoices/admin/stats`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  async getInvoiceById(invoiceId: string): Promise<TherapistInvoice> {
    const response = await axios.get(`${API_URL}/therapist-invoices/${invoiceId}`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  async approveInvoice(invoiceId: string, notes?: string): Promise<TherapistInvoice> {
    const response = await axios.patch(
      `${API_URL}/therapist-invoices/${invoiceId}/approve`,
      { notes },
      { withCredentials: true }
    );
    return response.data.data;
  },

  async rejectInvoice(
    invoiceId: string,
    rejection_reason: string,
    notes?: string
  ): Promise<TherapistInvoice> {
    const response = await axios.patch(
      `${API_URL}/therapist-invoices/${invoiceId}/reject`,
      { rejection_reason, notes },
      { withCredentials: true }
    );
    return response.data.data;
  },

  async markAsPaid(
    invoiceId: string,
    payment_reference?: string,
    paid_date?: string,
    notes?: string
  ): Promise<TherapistInvoice> {
    const response = await axios.patch(
      `${API_URL}/therapist-invoices/${invoiceId}/mark-paid`,
      { payment_reference, paid_date, notes },
      { withCredentials: true }
    );
    return response.data.data;
  },
};
