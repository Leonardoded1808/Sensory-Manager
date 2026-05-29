import React, { useState, useMemo, useRef } from 'react';
import { Invoice, User, Appointment, Client, Specialist, MedicalRecordEntry, TicketConfig } from '../types.ts';
import { DownloadIcon, DatabaseIcon } from './icons.tsx';
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
    ticketConfig: TicketConfig;
    onAddMedicalRecordEntry: (data: Omit<MedicalRecordEntry, 'id'>) => Promise<void>;
    onUpdateMedicalRecordEntry: (data: MedicalRecordEntry) => Promise<void>;
    onDeleteMedicalRecordEntry: (id: string) => Promise<void>;
    onAddAppointment: (newAppointments: Omit<Appointment, 'id'>[]) => Promise<void>;
    onUpdateAppointment: (updatedAppointment: Appointment, scope: 'single' | 'all') => Promise<void>;
    onDeleteAppointment: (appointmentId: string, scope: 'single' | 'all') => Promise<void>;
    onImportSpecialistData: (data: string) => void;
    onExportSpecialistJSON: (id: string) => void;
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
    const specialistFileInputRef = useRef<HTMLInputElement>(null);

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (window.confirm("¿Importar datos actualizados de sus pacientes desde este archivo?")) {
                    props.onImportSpecialistData(content);
                }
            };
            reader.readAsText(file);
        }
        if (e.target) e.target.value = '';
    };

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
                        <div className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800">Sincronización de Datos</h3>
                                <p className="text-sm text-gray-500">Exporte sus historiales clínicos o reciba actualizaciones de administrador</p>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => props.onExportSpecialistJSON(currentUser.id)} className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                                    <DownloadIcon className="w-4 h-4"/> Exportar Datos
                                </button>
                                <button onClick={() => specialistFileInputRef.current?.click()} className="inline-flex justify-center items-center gap-2 py-2 px-4 border border-purple-300 shadow-sm text-sm font-bold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">
                                    <DatabaseIcon className="w-4 h-4"/> Importar Actualización
                                </button>
                                <input type="file" ref={specialistFileInputRef} onChange={handleImportFile} accept=".json" className="hidden"/>
                            </div>
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
                            ticketConfig={props.ticketConfig}
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
