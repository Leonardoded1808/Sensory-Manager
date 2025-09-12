

import React, { useState, useEffect } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, DebtInfo, MedicalRecordEntry } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, BackIcon, ChevronRightIcon, SparkleIcon, EditIcon, TrashIcon } from './icons.tsx';
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

const ClientDetailView: React.FC<{ client: Client; invoices: Invoice[]; medicalRecords: MedicalRecordEntry[]; onBack: () => void; onEdit: () => void; onDelete: () => void; }> = ({ client, invoices, medicalRecords, onBack, onEdit, onDelete }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            <hr />
            <div>
                <h4 className="font-bold text-lg mb-2">Paciente: {client.patientName}</h4>
                <p className="text-gray-600">Fecha de Nacimiento: {client.patientDob || 'N/A'}</p>
            </div>
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
                <label className="block text-sm font-bold text-gray-300 mb-1">Nombre del Representante</label>
                <input type="text" name="representativeName" defaultValue={initialData?.representativeName} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nombre del Paciente</label>
                <input type="text" name="patientName" defaultValue={initialData?.patientName} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Cédula / ID</label>
                    <input type="text" name="representativeId" defaultValue={initialData?.representativeId} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Fecha Nac. Paciente</label>
                    <input 
                        type="tel" 
                        name="patientDob" 
                        value={dob}
                        onChange={handleDobChange}
                        placeholder="DD/MM/AAAA" 
                        maxLength={10}
                        className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" 
                    />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    );
};

interface ClientsViewProps {
    clients: Client[];
    invoices: Invoice[];
    medicalRecords: MedicalRecordEntry[];
    onAddClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateClient: (client: Client) => Promise<void>;
    onDeleteClient: (clientId: string) => Promise<void>;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, invoices, medicalRecords, onAddClient, onUpdateClient, onDeleteClient }) => {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

    const selectedClient = clients.find(c => c.id === selectedClientId);
    
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
            setSelectedClientId(null); // Return to list view
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


    if (selectedClient) {
        return (
            <div className="p-5 animate-fadeIn">
                <ClientDetailView 
                    client={selectedClient} 
                    invoices={invoices}
                    medicalRecords={medicalRecords}
                    onBack={() => setSelectedClientId(null)} 
                    onEdit={() => handleOpenEditModal(selectedClient)}
                    onDelete={() => handleDeleteRequest(selectedClient.id)}
                />
            </div>
        );
    }
    
    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Agregar</span>
                </button>
            </div>

            {clients.length > 0 ? (
                <div className="space-y-3">
                    {clients.map(client => (
                        <ClientListItem key={client.id} client={client} onSelect={() => setSelectedClientId(client.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay clientes registrados.</p>
                    <p className="text-gray-500">Presiona 'Agregar' para crear el primero.</p>
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
        </div>
    );
};

export default ClientsView;