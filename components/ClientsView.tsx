

import React, { useState, useEffect } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, DebtInfo, MedicalRecordEntry, Appointment, WhatsAppTemplate } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, BackIcon, ChevronRightIcon, SparkleIcon, EditIcon, TrashIcon, WhatsAppIcon, PhoneIcon } from './icons.tsx';
// FIX: Add .ts extension to import path.
import { calculateDebtForClient } from '../services/debtService.ts';
// FIX: Add .ts extension to import path.
import { generateClientReport } from '../services/geminiService.ts';

const statusStyles = {
    'Pagada': 'bg-green-100 text-green-800',
    'Abonada': 'bg-yellow-100 text-yellow-800',
    'Pendiente': 'bg-red-100 text-red-800',
};

const ClientListItem: React.FC<{ client: Client; onSelect: () => void }> = ({ client, onSelect }) => (
    <div onClick={onSelect} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center transition-transform hover:scale-105 cursor-pointer">
        <div>
            <p className="font-bold text-lg text-gray-800">{client.representativeName}</p>
            <p className="text-sm text-gray-500">Paciente: {client.patientName}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </div>
);

const ClientDetailView: React.FC<{ client: Client; invoices: Invoice[]; medicalRecords: MedicalRecordEntry[]; appointments: Appointment[]; whatsappTemplates: WhatsAppTemplate[]; onBack: () => void; onEdit: () => void; onDelete: () => void; }> = ({ client, invoices, medicalRecords, appointments, whatsappTemplates, onBack, onEdit, onDelete }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const clientInvoices = invoices.filter(inv => inv.clientId === client.id)
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                  
    const clientMedicalRecords = medicalRecords.filter(rec => rec.clientId === client.id)
                                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        setReport(null);
        setError(null);
        try {
            const debtInfo = calculateDebtForClient(client, invoices);
            const generatedReport = await generateClientReport(client, clientInvoices, debtInfo, clientMedicalRecords);
            setReport(generatedReport);
        } catch (err) {
            setError('Ocurrió un error al generar el informe con IA.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const clientAppointments = appointments.filter(appt => appt.clientId === client.id)
        .filter(appt => new Date(appt.start).getTime() > new Date().getTime())
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    
    const nextAppointment = clientAppointments[0];

    const sendMessage = (templateString: string, contextAppointment: Appointment | null) => {
        let message = templateString
            .replace(/\{\{representante\}\}/g, client.representativeName)
            .replace(/\{\{paciente\}\}/g, client.patientName);
            
        if (contextAppointment || nextAppointment) {
            const currentAppt = contextAppointment || nextAppointment;
            const date = new Date(currentAppt.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            const time = new Date(currentAppt.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            message = message
                .replace(/\{\{fecha\}\}/g, date)
                .replace(/\{\{hora\}\}/g, time);
        } else {
            message = message
                .replace(/\{\{fecha\}\}/g, '[FECHA]')
                .replace(/\{\{hora\}\}/g, '[HORA]');
        }
        
        const phoneParam = client.phone ? client.phone.replace(/\D/g, '') : '';
        const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`;
        
        window.open(url, '_blank');
        setShowTemplateSelector(false);
    };

    return (
    <div>
        <button onClick={onBack} className="mb-4 text-blue-600 font-semibold flex items-center space-x-2">
            <BackIcon className="w-5 h-5" />
            <span>Volver</span>
        </button>
        <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-800">{client.representativeName}</h3>
                    <p className="text-gray-500">ID: {client.representativeId || 'N/A'}</p>
                 </div>
                <div className="flex items-center space-x-1">
                     <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar Cliente">
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar Cliente">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            
            {client.phone && (
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100 w-fit">
                    <span className="font-semibold text-gray-700">{client.phone}</span>
                    <a href={`tel:${client.phone.replace(/\D/g, '')}`} className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition-colors" title="Llamar">
                        <PhoneIcon className="w-5 h-5"/>
                    </a>
                    <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition-colors" title="Enviar WhatsApp">
                        <WhatsAppIcon className="w-5 h-5"/>
                    </a>
                </div>
            )}

            <hr />
            <div>
                <h4 className="font-bold text-lg mb-2">Paciente: {client.patientName}</h4>
                <p className="text-gray-600">Fecha de Nacimiento: {client.patientDob || 'N/A'}</p>
            </div>
            
            {nextAppointment && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center relative">
                    <div>
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Próxima Cita</p>
                        <p className="font-semibold text-gray-800">
                            {new Date(nextAppointment.start).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} a las {new Date(nextAppointment.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    {client.phone && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                                className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-600 transition-colors flex items-center space-x-2 shrink-0"
                            >
                                <WhatsAppIcon className="w-4 h-4"/>
                                <span>Avisar Cita</span>
                            </button>
                            {showTemplateSelector && (
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden divide-y divide-gray-100">
                                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Seleccionar Plantilla</p>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {whatsappTemplates.length > 0 ? whatsappTemplates.map(template => (
                                            <button 
                                                key={template.id}
                                                onClick={() => sendMessage(template.template, nextAppointment)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <p className="font-bold text-sm text-gray-800">{template.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{template.template}</p>
                                            </button>
                                        )) : (
                                            <div className="px-4 py-3 text-sm text-gray-500">No hay plantillas configuradas. Configure una en el panel de gestión.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div>
                 <button 
                    onClick={handleGenerateReport} 
                    disabled={isGenerating}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                    <SparkleIcon className="w-5 h-5"/>
                    <span>{isGenerating ? 'Generando...' : 'Informe con IA'}</span>
                </button>
            </div>
        </div>

        <div className="mt-6">
            <h5 className="font-bold text-xl mb-3 text-gray-700">Historial de Facturas</h5>
            {clientInvoices.length > 0 ? (
                <div className="space-y-3">
                    {clientInvoices.map(invoice => (
                        <div key={invoice.id} className="bg-white p-4 rounded-xl shadow-md">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{invoice.serviceName}</p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(invoice.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                     <p className="font-extrabold text-lg text-gray-800">${invoice.price.toFixed(2)}</p>
                                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusStyles[invoice.status]}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 text-sm">
                                <p>Pagado: <span className="font-medium text-green-600">${invoice.amountPaid.toFixed(2)}</span></p>
                                <p>Saldo: <span className="font-medium text-red-600">${invoice.balance.toFixed(2)}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white text-center p-8 rounded-xl shadow-md">
                    <p className="text-gray-500">No hay facturas para este cliente.</p>
                </div>
            )}
        </div>
        
        {isGenerating && (
            <div className="mt-4 text-center py-10 bg-white rounded-xl shadow-md">
                <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="text-lg font-semibold text-gray-600">Analizando datos del cliente...</p>
                <p className="text-gray-500">Esto puede tardar unos segundos.</p>
            </div>
        )}

        {error && (
            <div className="mt-4 text-center py-10 bg-red-50 p-4 rounded-xl shadow-md">
                 <p className="text-lg font-semibold text-red-700">{error}</p>
            </div>
        )}
        
        {report && (
            <div className="mt-4 bg-white p-6 rounded-xl shadow-md animate-fadeIn">
                 <pre className="text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
            </div>
        )}

    </div>
    );
};

const ClientForm: React.FC<{ 
    onClose: () => void; 
    onSubmit: (clientData: Omit<Client, 'id' | 'createdAt'> | Client) => Promise<void>;
    initialData?: Client | null;
}> = ({ onClose, onSubmit, initialData }) => {
    const [dob, setDob] = useState(initialData?.patientDob || '');

    const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        let formattedValue = '';

        if (value.length > 0) {
            formattedValue += value.substring(0, 2);
        }
        if (value.length > 2) {
            formattedValue += '/' + value.substring(2, 4);
        }
        if (value.length > 4) {
            formattedValue += '/' + value.substring(4, 8);
        }
        setDob(formattedValue);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const representativeName = (formData.get('representativeName') as string || '').trim();
        const patientName = (formData.get('patientName') as string || '').trim();

        if (!representativeName || !patientName) {
            alert("El nombre del representante y del paciente son obligatorios.");
            return;
        }

        const data = {
            representativeName,
            patientName,
            representativeId: formData.get('representativeId') as string,
            patientDob: dob,
            phone: formData.get('phone') as string,
        };
        
        if (initialData) {
            await onSubmit({ ...initialData, ...data });
        } else {
            await onSubmit(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Representante</label>
                <input 
                    type="text" 
                    name="representativeName" 
                    defaultValue={initialData?.representativeName} 
                    className="w-full p-3.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej. María Pérez"
                    required 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Paciente (Niño/a)</label>
                <input 
                    type="text" 
                    name="patientName" 
                    defaultValue={initialData?.patientName} 
                    className="w-full p-3.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej. Juanito Pérez"
                    required 
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cédula / ID del Representante</label>
                    <input 
                        type="text" 
                        name="representativeId" 
                        defaultValue={initialData?.representativeId} 
                        className="w-full p-3.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                        placeholder="Ej. 12.345.678"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha Nac. Paciente</label>
                    <input 
                        type="tel" 
                        name="patientDob" 
                        value={dob}
                        onChange={handleDobChange}
                        placeholder="DD/MM/AAAA" 
                        maxLength={10}
                        className="w-full p-3.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono Móvil (WhatsApp)</label>
                <input 
                    type="tel" 
                    name="phone" 
                    defaultValue={initialData?.phone} 
                    className="w-full p-3.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej. +584141234567"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors text-base">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-base">Guardar Cliente</button>
            </div>
        </form>
    );
};

interface ClientsViewProps {
    clients: Client[];
    invoices: Invoice[];
    medicalRecords: MedicalRecordEntry[];
    appointments: Appointment[]; // NEW
    whatsappTemplates: WhatsAppTemplate[];
    onAddClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateClient: (client: Client) => Promise<void>;
    onDeleteClient: (clientId: string) => Promise<void>;
    initialSelectedClientId?: string | null;
    onClearSelection?: () => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, invoices, medicalRecords, appointments, whatsappTemplates, onAddClient, onUpdateClient, onDeleteClient, initialSelectedClientId, onClearSelection }) => {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(initialSelectedClientId || null);
    
    React.useEffect(() => {
        if (initialSelectedClientId) {
            setSelectedClientId(initialSelectedClientId);
        }
    }, [initialSelectedClientId]);

    const [isModalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'alpha' | 'closest_appt'>('alpha');
    const [showTemplateSelectorFor, setShowTemplateSelectorFor] = useState<string | null>(null);

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleBackFromDetail = () => {
        setSelectedClientId(null);
        if (onClearSelection) onClearSelection();
    };

    const now = new Date();
    const clientAppointments = React.useMemo(() => {
        const map = new Map<string, Appointment>();
        appointments.forEach(appt => {
            if (!appt.clientId) return; // Skip non-client appointments
            const apptDate = new Date(appt.start);
            if (apptDate >= now) {
                if (!map.has(appt.clientId) || apptDate < new Date(map.get(appt.clientId)!.start)) {
                    map.set(appt.clientId, appt);
                }
            }
        });
        return map;
    }, [appointments]);

    const needsReminder = (clientId: string) => {
        const appt = clientAppointments.get(clientId);
        if (!appt) return false;
        const diffDays = (new Date(appt.start).getTime() - now.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 2; // Next ~48 hours
    };

    const filteredClients = React.useMemo(() => {
        let result = [...clients];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(c => 
                c.patientName.toLowerCase().includes(lowerTerm) ||
                c.representativeName.toLowerCase().includes(lowerTerm) ||
                (c.representativeId && c.representativeId.includes(searchTerm)) ||
                (c.phone && c.phone.includes(searchTerm))
            );
        }

        if (sortBy === 'alpha') {
             result.sort((a, b) => a.patientName.localeCompare(b.patientName));
        } else {
             result.sort((a, b) => {
                  const aAppt = clientAppointments.get(a.id);
                  const bAppt = clientAppointments.get(b.id);
                  if (aAppt && bAppt) return new Date(aAppt.start).getTime() - new Date(bAppt.start).getTime();
                  if (aAppt) return -1;
                  if (bAppt) return 1;
                  return a.patientName.localeCompare(b.patientName);
             });
        }

        result.sort((a, b) => {
             const aRem = needsReminder(a.id) ? 0 : 1;
             const bRem = needsReminder(b.id) ? 0 : 1;
             return aRem - bRem;
        });

        return result;
    }, [clients, searchTerm, sortBy, clientAppointments]);

    const handleWhatsAppClick = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation();
        if (showTemplateSelectorFor === client.id) {
            setShowTemplateSelectorFor(null);
        } else {
            setShowTemplateSelectorFor(client.id);
        }
    };
    
    const sendListItemMessage = (e: React.MouseEvent, client: Client, templateString: string) => {
        e.stopPropagation();
        const appt = clientAppointments.get(client.id);
        
        let message = templateString
            .replace(/\{\{representante\}\}/g, client.representativeName)
            .replace(/\{\{paciente\}\}/g, client.patientName);

        if (appt) {
             const date = new Date(appt.start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
             const time = new Date(appt.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
             message = message
                  .replace(/\{\{fecha\}\}/g, date)
                  .replace(/\{\{hora\}\}/g, time);
        } else {
             message = message
                  .replace(/\{\{fecha\}\}/g, '[FECHA]')
                  .replace(/\{\{hora\}\}/g, '[HORA]');
        }

        const phoneParam = client.phone ? client.phone.replace(/\D/g, '') : '';
        const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        setShowTemplateSelectorFor(null);
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setEditingClient(null);
    };

    const handleOpenAddModal = () => {
        setEditingClient(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (client: Client) => {
        setEditingClient(client);
        setModalOpen(true);
    };

    const handleDeleteRequest = (clientId: string) => {
        setDeletingClientId(clientId);
    };

    const confirmDelete = async () => {
        if (deletingClientId) {
            await onDeleteClient(deletingClientId);
            setDeletingClientId(null);
            setSelectedClientId(null); 
        }
    };
    
    const handleFormSubmit = async (clientData: Omit<Client, 'id' | 'createdAt'> | Client) => {
        if ('id' in clientData) {
            await onUpdateClient(clientData);
        } else {
            await onAddClient(clientData);
        }
        closeModal();
    };

    return (
        <>
            {selectedClient ? (
                <div className="p-5 animate-fadeIn">
                    <ClientDetailView 
                        client={selectedClient} 
                        invoices={invoices}
                        medicalRecords={medicalRecords}
                        appointments={appointments}
                        whatsappTemplates={whatsappTemplates}
                        onBack={handleBackFromDetail} 
                        onEdit={() => handleOpenEditModal(selectedClient)}
                        onDelete={() => handleDeleteRequest(selectedClient.id)}
                    />
                </div>
            ) : (
                <div className="p-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                        <div className="flex items-center space-x-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                     <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                 </div>
                                 <input 
                                     type="text" 
                                     value={searchTerm}
                                     onChange={(e) => setSearchTerm(e.target.value)}
                                     placeholder="Buscar paciente o número..." 
                                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                 />
                            </div>
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'alpha' | 'closest_appt')}
                                className="p-2 border border-gray-300 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="alpha">A-Z</option>
                                <option value="closest_appt">Citas Cercanas</option>
                            </select>
                        </div>
                        <button onClick={handleOpenAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2 shrink-0">
                            <AddIcon className="w-5 h-5" />
                            <span className="font-semibold text-sm">Agregar Paciente</span>
                        </button>
                    </div>

                    {filteredClients.length > 0 ? (
                        <div className="space-y-3">
                            {filteredClients.map(client => {
                                const showReminder = needsReminder(client.id);
                                return (
                                    <div key={client.id} onClick={() => setSelectedClientId(client.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center transition-transform hover:scale-[1.01] cursor-pointer">
                                        <div className="flex items-center space-x-4">
                                            {showReminder && (
                                                <div className="flex-shrink-0 animate-pulse">
                                                    <span className="flex w-3 h-3 bg-red-500 rounded-full"></span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-lg text-gray-800">{client.patientName}</p>
                                                <p className="text-xs text-gray-500">Rep: {client.representativeName} {client.phone ? `• ${client.phone}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {showReminder && (
                                                <div className="relative">
                                                    <button 
                                                        onClick={(e) => handleWhatsAppClick(e, client)} 
                                                        title="Enviar recordatorio por WhatsApp"
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition-colors font-bold text-xs"
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4"/>
                                                        <span>Recordatorio</span>
                                                    </button>
                                                    {showTemplateSelectorFor === client.id && (
                                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-10 overflow-hidden divide-y divide-gray-100" onClick={(e) => e.stopPropagation()}>
                                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                                                                Seleccionar Plantilla
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto">
                                                                {whatsappTemplates.length > 0 ? whatsappTemplates.map(template => (
                                                                    <button 
                                                                        key={template.id}
                                                                        onClick={(e) => sendListItemMessage(e, client, template.template)}
                                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors block border-b border-gray-100 last:border-0"
                                                                    >
                                                                        <p className="font-bold text-xs text-gray-800">{template.title}</p>
                                                                    </button>
                                                                )) : (
                                                                    <div className="px-4 py-3 text-xs text-gray-500">Configure plantillas en gestión.</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-lg font-semibold text-gray-600">No se encontraron pacientes.</p>
                            <p className="text-gray-500">Intente buscar con otro parámetro o agregue uno nuevo.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Editar Cliente" : "Agregar Nuevo Cliente"}>
                <ClientForm 
                    onClose={closeModal} 
                    onSubmit={handleFormSubmit}
                    initialData={editingClient}
                />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingClientId}
                onClose={() => setDeletingClientId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación de Cliente"
                message="¿Está seguro? Se eliminará este cliente y TODAS sus facturas e historiales médicos asociados. Esta acción es irreversible."
                confirmText="Sí, Eliminar Todo"
            />
        </>
    );
};

export default ClientsView;