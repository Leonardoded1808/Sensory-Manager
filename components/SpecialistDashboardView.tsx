import React, { useState, useMemo } from 'react';
import { Invoice, User, Appointment, Client, Specialist, MedicalRecordEntry } from '../types.ts';
import MedicalHistoryView from './MedicalHistoryView.tsx';
import CalendarView from './CalendarView.tsx';
import Notifications from './Notifications.tsx';

interface SpecialistDashboardViewProps {
    currentUser: User;
    invoices: Invoice[];
    appointments: Appointment[];
    clients: Client[];
    specialists: Specialist[];
    medicalRecords: MedicalRecordEntry[];
    onAddMedicalRecordEntry: (data: Omit<MedicalRecordEntry, 'id'>) => Promise<void>;
    onUpdateMedicalRecordEntry: (data: MedicalRecordEntry) => Promise<void>;
    onDeleteMedicalRecordEntry: (id: string) => Promise<void>;
    onAddAppointment: (newAppointments: Omit<Appointment, 'id'>[]) => Promise<void>;
    onUpdateAppointment: (updatedAppointment: Appointment, scope: 'single' | 'all') => Promise<void>;
    onDeleteAppointment: (appointmentId: string, scope: 'single' | 'all') => Promise<void>;
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
);

type SpecialistTab = 'dashboard' | 'medicalHistory' | 'calendar';

const SpecialistDashboardView: React.FC<SpecialistDashboardViewProps> = (props) => {
    const { currentUser, invoices, appointments, clients, specialists, medicalRecords } = props;
    
    // FIX: Moved the role check to the top of the component to allow for type narrowing.
    if (currentUser.role !== 'specialist') {
        return <div className="p-5">Error: Vista no disponible para administradores.</div>;
    }

    const [activeTab, setActiveTab] = useState<SpecialistTab>('dashboard');

    const specialistInvoices = useMemo(() => {
        return invoices.filter(inv => inv.specialistId === currentUser.id);
    }, [currentUser, invoices]);
    
    const assignedClientIds = useMemo(() => {
        const clientIdsFromInvoices = new Set(specialistInvoices.map(inv => inv.clientId));
        const clientIdsFromAppointments = new Set(
            appointments
                .filter(a => a.specialistId === currentUser.id)
                .map(a => a.clientId)
        );
        return new Set([...clientIdsFromInvoices, ...clientIdsFromAppointments]);
    }, [specialistInvoices, appointments, currentUser.id]);

    const assignedClients = useMemo(() => {
        return clients.filter(c => assignedClientIds.has(c.id));
    }, [clients, assignedClientIds]);

    const stats = useMemo(() => {
        const totalEarnings = specialistInvoices.reduce((sum, inv) => sum + (inv.specialistEarnings || 0), 0);
        return {
            totalEarnings: totalEarnings.toFixed(2),
            servicesProvided: specialistInvoices.length,
            patientsAttended: assignedClientIds.size
        };
    }, [specialistInvoices, assignedClientIds]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <StatCard title="Ganancias Totales" value={`$${stats.totalEarnings}`} subtext="Suma de ganancias por servicio" />
                            <StatCard title="Servicios Facturados" value={String(stats.servicesProvided)} />
                            <StatCard title="Pacientes Asignados" value={String(stats.patientsAttended)} />
                        </div>
                        <Notifications 
                            services={[]} 
                            invoices={[]} 
                            appointments={appointments} 
                            clients={clients} 
                            specialists={specialists} 
                            currentUser={currentUser} 
                        />
                    </div>
                );
            case 'medicalHistory':
                return <MedicalHistoryView 
                            clients={assignedClients}
                            medicalRecords={medicalRecords}
                            invoices={invoices}
                            specialists={specialists}
                            currentUser={currentUser}
                            onAddMedicalRecordEntry={props.onAddMedicalRecordEntry}
                            onUpdateMedicalRecordEntry={props.onUpdateMedicalRecordEntry}
                            onDeleteMedicalRecordEntry={props.onDeleteMedicalRecordEntry}
                        />;
            case 'calendar':
                return <CalendarView 
                            appointments={appointments}
                            clients={assignedClients}
                            specialists={specialists}
                            currentUser={currentUser}
                            onAddAppointment={props.onAddAppointment}
                            onUpdateAppointment={props.onUpdateAppointment}
                            onDeleteAppointment={props.onDeleteAppointment}
                        />;
            default:
                return null;
        }
    };


    const TabButton: React.FC<{ tab: SpecialistTab; label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-5 animate-fadeIn space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">Bienvenido, {currentUser.name}</h2>
                <div className="flex items-center gap-2">
                    <TabButton tab="dashboard" label="Resumen" />
                    <TabButton tab="medicalHistory" label="Historial Médico" />
                    <TabButton tab="calendar" label="Calendario" />
                </div>
            </div>
            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default SpecialistDashboardView;
