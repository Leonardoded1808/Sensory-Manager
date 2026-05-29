export interface Client {
    id: string;
    representativeName: string;
    patientName: string;
    representativeId?: string;
    patientDob?: string;
    phone?: string;
    createdAt: string;
}

export interface Service {
    id: string;
    serviceName: string;
    price: number;
    billingType: 'Mensualidad' | 'Paquete de Sesiones' | 'Por Sesión';
    createdAt: string;
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
}

export interface Invoice {
    id: string;
    clientId: string;
    serviceId: string;
    serviceName: string;
    specialistId?: string;
    price: number;
    amountPaid: number;
    balance: number;
    status: 'Pagada' | 'Abonada' | 'Pendiente';
    createdAt: string;
    payments: Payment[];
    specialistEarnings?: number;
    managerEarnings?: { managerId: string; amount: number }[];
}

export interface DebtInfo {
    client: Client;
    totalDebt: number;
    pendingInvoices: Invoice[];
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    type: 'Fijo' | 'Variable';
    date: string; // YYYY-MM-DD
}

export interface Specialist {
    id: string;
    name: string;
    serviceIds: string[];
}

export interface Manager {
    id: string;
    name: string;
}

export interface SpecialistPayout {
    id: string;
    specialistId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    notes?: string;
}

export interface ManagerPayout {
    id:string;
    managerId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    notes?: string;
}

export interface MedicalRecordEntry {
    id: string;
    clientId: string;
    date: string; // YYYY-MM-DD
    activityDescription: string;
    expectedMilestones: string;
    achievementStatus: 'Logrado' | 'En Progreso' | 'No Logrado';
    therapistNotes?: string;
    specialistId?: string; // ID of the specialist who created the entry
    image?: string; // base64 data URL
    pdf?: string; // base64 PDF data URL
    pdfName?: string; // original PDF file name
}

export interface MedicalReportData {
    client: Client;
    medicalRecords: MedicalRecordEntry[];
    invoices: Invoice[];
    customInstructions?: string;
}

export interface TicketConfig {
    logo?: string; // base64
    companyName?: string;
    companyId?: string;
    address?: string;
    phone?: string;
    email?: string;
    additionalInfo?: string; // Bank details, etc.
    footer?: string; // Thank you message
}

export interface WhatsAppTemplate {
    id: string;
    title: string;
    template: string;
}

export interface Appointment {
    id: string;
    title: string;
    clientId?: string; // Optional for tasks
    specialistId: string;
    notes: string;
    start: string; // ISO String
    end: string;   // ISO String
    groupId?: string; // To link recurring appointments
}

export type Page = 
    | 'dashboard' 
    | 'clients' 
    | 'services' 
    | 'invoicing'
    | 'expenses'
    | 'debt'
    | 'medicalHistory'
    | 'specialists'
    | 'managers'
    | 'management'
    | 'reports'
    | 'calendar';

export type User = {
    role: 'admin';
} | {
    role: 'specialist';
    id: string;
    name: string;
};

export interface Notification {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface SpecialistMedicalData {
    specialistName: string;
    exportDate: string;
    records: MedicalRecordEntry[];
    clients?: Client[];
    appointments?: Appointment[];
    services?: Service[];
}

export interface SpecialistExportData {
    specialist: Specialist;
    assignedPatients: Client[];
    invoices: Invoice[];
    financialSummary: {
        owedByCompany: number;
        pendingFromClients: number;
        totalPotentialEarnings: number;
    };
}