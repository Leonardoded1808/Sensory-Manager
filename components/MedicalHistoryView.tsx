import React, { useState, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, MedicalRecordEntry, Specialist, User } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, BackIcon, ChevronRightIcon, SparkleIcon, EditIcon, TrashIcon } from './icons.tsx';
// FIX: Add .ts extension to import path.
import { generateMedicalReport } from '../services/geminiService.ts';


const PatientListItem: React.FC<{ client: Client; onSelect: () => void }> = ({ client, onSelect }) => (
    <div onClick={onSelect} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center transition-transform hover:scale-105 cursor-pointer">
        <div>
            <p className="font-bold text-lg text-gray-800">{client.patientName}</p>
            <p className="text-sm text-gray-500">Rep.: {client.representativeName}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </div>
);

export const MedicalEntryForm: React.FC<{ 
    onClose: () => void; 
    onSubmit: (data: Omit<MedicalRecordEntry, 'id' | 'clientId'> | MedicalRecordEntry) => Promise<void>;
    initialData?: MedicalRecordEntry | null;
}> = ({ onClose, onSubmit, initialData }) => {
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
    const [base64Image, setBase64Image] = useState<string | null>(initialData?.image || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setBase64Image(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            date: formData.get('date') as string,
            activityDescription: formData.get('activityDescription') as string,
            expectedMilestones: formData.get('expectedMilestones') as string,
            achievementStatus: formData.get('achievementStatus') as 'Logrado' | 'En Progreso' | 'No Logrado',
            therapistNotes: formData.get('therapistNotes') as string,
            image: base64Image || undefined,
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
                <label className="block text-sm font-bold text-gray-300 mb-1">Fecha</label>
                <input type="date" name="date" defaultValue={initialData?.date || new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{colorScheme: 'dark'}} required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Actividad Realizada</label>
                <textarea name="activityDescription" rows={2} defaultValue={initialData?.activityDescription} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Hitos Esperados</label>
                <textarea name="expectedMilestones" rows={2} defaultValue={initialData?.expectedMilestones} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Estado del Logro</label>
                <select name="achievementStatus" defaultValue={initialData?.achievementStatus} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Logrado">Logrado</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="No Logrado">No Logrado</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Notas del Terapeuta</label>
                <textarea name="therapistNotes" rows={3} defaultValue={initialData?.therapistNotes} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Anexar Imagen (Opcional)</label>
                <div className="mt-1 flex items-center space-x-4 p-3 bg-slate-700 border border-slate-600 rounded-lg">
                    {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                    )}
                    <label htmlFor="image-upload" className="cursor-pointer bg-slate-600 py-2 px-3 border border-slate-500 rounded-md text-sm font-medium text-gray-200 hover:bg-slate-500">
                        <span>{imagePreview ? 'Cambiar' : 'Seleccionar Archivo'}</span>
                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    {imagePreview && (
                        <button type="button" onClick={() => { setImagePreview(null); setBase64Image(null); }} className="text-sm text-red-400 hover:text-red-300">Quitar</button>
                    )}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar Entrada</button>
            </div>
        </form>
    );
};

const GenerateReportModal: React.FC<{onClose: () => void; onGenerate: (instructions: string) => void; isGenerating: boolean;}> = ({ onClose, onGenerate, isGenerating }) => {
    const [instructions, setInstructions] = useState('');
    
    const handleSubmit = () => {
        onGenerate(instructions);
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Instrucciones Adicionales (Opcional)</label>
                <textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4} 
                    className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" 
                    placeholder="Ej: Enfocarse en el progreso motor de las últimas 4 semanas."
                />
                 <p className="text-xs text-gray-400 mt-1">Aquí puede darle indicaciones a la IA para que el informe sea más específico.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500" disabled={isGenerating}>Cancelar</button>
                <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:bg-purple-300" disabled={isGenerating}>
                    <SparkleIcon className="w-5 h-5"/>
                    <span>{isGenerating ? 'Generando...' : 'Generar Informe'}</span>
                </button>
            </div>
        </div>
    );
};


const achievementStyles = {
    'Logrado': 'bg-green-100 text-green-800 border-green-400',
    'En Progreso': 'bg-yellow-100 text-yellow-800 border-yellow-400',
    'No Logrado': 'bg-red-100 text-red-800 border-red-400',
};

const MedicalHistoryDetailView: React.FC<{ 
    client: Client; 
    records: MedicalRecordEntry[];
    invoices: Invoice[];
    specialists: Specialist[];
    currentUser: User;
    onBack: () => void; 
    onAddEntry: (data: Omit<MedicalRecordEntry, 'id' | 'clientId'>) => Promise<void>;
    onUpdateEntry: (entry: MedicalRecordEntry) => Promise<void>;
    onDeleteEntry: (entryId: string) => Promise<void>;
}> = ({ client, records, invoices, specialists, currentUser, onBack, onAddEntry, onUpdateEntry, onDeleteEntry }) => {
    
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MedicalRecordEntry | null>(null);
    const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [viewingImage, setViewingImage] = useState<string | null>(null); // State for image viewer

    const specialistsMap = useMemo(() => new Map(specialists.map(s => [s.id, s.name])), [specialists]);
    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records]);
    
    const closeEntryModal = () => {
        setEditingEntry(null);
        setEntryModalOpen(false);
    };

    const handleOpenAddModal = () => {
        setEditingEntry(null);
        setEntryModalOpen(true);
    };

    const handleOpenEditModal = (entry: MedicalRecordEntry) => {
        setEditingEntry(entry);
        setEntryModalOpen(true);
    };

    const handleFormSubmit = async (data: Omit<MedicalRecordEntry, 'id' | 'clientId'> | MedicalRecordEntry) => {
        if ('id' in data) { // Editing
            await onUpdateEntry(data);
        } else { // Adding
            await onAddEntry(data);
        }
        closeEntryModal();
    };

    const handleDeleteRequest = (entryId: string) => {
        setDeletingEntryId(entryId);
    };

    const confirmDelete = async () => {
        if (deletingEntryId) {
            await onDeleteEntry(deletingEntryId);
            setDeletingEntryId(null);
        }
    };

    const handleGenerateReport = async (customInstructions: string) => {
        setReportModalOpen(false);
        setIsGenerating(true);
        setReport(null);
        setError(null);
        try {
            const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
            const reportData = { client, medicalRecords: records, invoices: clientInvoices, customInstructions };
            const generatedReport = await generateMedicalReport(reportData);
            setReport(generatedReport);
        } catch (err) {
            setError('Ocurrió un error al generar el informe médico con IA.');
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div>
            <button onClick={onBack} className="mb-4 text-blue-600 font-semibold flex items-center space-x-2">
                <BackIcon className="w-5 h-5" />
                <span>Volver a Pacientes</span>
            </button>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                 <h3 className="text-2xl font-bold text-gray-800">Historial de: {client.patientName}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setReportModalOpen(true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow hover:bg-purple-700 flex items-center space-x-2">
                        <SparkleIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">Informe con IA</span>
                    </button>
                    <button onClick={handleOpenAddModal} className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                        <AddIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">Nueva Entrada</span>
                    </button>
                 </div>
            </div>

            {isGenerating && (
                <div className="my-4 text-center py-10 bg-white rounded-xl shadow-md">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-lg font-semibold text-gray-600">Generando informe médico...</p>
                    <p className="text-gray-500">Esto puede tardar unos segundos.</p>
                </div>
            )}
            {error && <div className="my-4 text-center py-10 bg-red-50 p-4 rounded-xl shadow-md"><p className="text-lg font-semibold text-red-700">{error}</p></div>}
            {report && <div className="my-4 bg-white p-6 rounded-xl shadow-md animate-fadeIn"><pre className="text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{report}</pre></div>}


            {sortedRecords.length > 0 ? (
                <div className="space-y-4">
                    {sortedRecords.map(record => {
                        const canEdit = currentUser.role === 'admin' || (currentUser.role === 'specialist' && record.specialistId === currentUser.id);
                        const specialistName = record.specialistId ? specialistsMap.get(record.specialistId) : 'Admin';
                        return (
                            <div key={record.id} className={`bg-white p-4 rounded-xl shadow-md border-l-4 ${achievementStyles[record.achievementStatus]}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-600">{new Date(record.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                                        <p className="text-xs text-purple-600 font-medium mt-1">Registrado por: {specialistName}</p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        {canEdit && (
                                            <>
                                                <button onClick={() => handleOpenEditModal(record)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
                                                    <EditIcon className="w-5 h-5"/>
                                                </button>
                                                <button onClick={() => handleDeleteRequest(record.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h4 className="font-semibold text-gray-800">Actividad:</h4>
                                    <p className="text-gray-700 pl-2">{record.activityDescription}</p>
                                </div>
                                <div className="mt-2">
                                    <h4 className="font-semibold text-gray-800">Hitos Esperados:</h4>
                                    <p className="text-gray-700 pl-2">{record.expectedMilestones}</p>
                                </div>
                                <div className="mt-2">
                                    <h4 className="font-semibold text-gray-800">Resultado: <span className={`font-bold`}>{record.achievementStatus}</span></h4>
                                </div>
                                {record.therapistNotes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-800">Notas del Terapeuta:</h4>
                                        <p className="text-gray-700 pl-2 whitespace-pre-wrap">{record.therapistNotes}</p>
                                    </div>
                                )}
                                {record.image && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-800">Imagen Anexa:</h4>
                                        <button onClick={() => setViewingImage(record.image!)} className="mt-2 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ring-offset-2">
                                            <img src={record.image} alt="Anexo de historial médico" className="max-w-full h-auto md:max-w-xs cursor-pointer hover:opacity-80 transition-opacity" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <p className="text-lg font-semibold text-gray-600">No hay entradas en el historial.</p>
                    <p className="text-gray-500">Presiona 'Nueva Entrada' para registrar el primer progreso.</p>
                </div>
            )}

            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 animate-fadeIn"
                    onClick={() => setViewingImage(null)}
                >
                    <button 
                        className="absolute top-4 right-4 text-white text-3xl font-bold"
                        onClick={() => setViewingImage(null)}
                        aria-label="Cerrar imagen"
                    >
                        &times;
                    </button>
                    <img
                        src={viewingImage}
                        alt="Vista ampliada del anexo"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

             <Modal isOpen={isReportModalOpen} onClose={() => setReportModalOpen(false)} title="Generar Informe Médico con IA">
                <GenerateReportModal 
                    onClose={() => setReportModalOpen(false)}
                    onGenerate={handleGenerateReport}
                    isGenerating={isGenerating}
                />
            </Modal>
            <Modal isOpen={isEntryModalOpen} onClose={closeEntryModal} title={editingEntry ? "Editar Entrada" : `Nueva Entrada para ${client.patientName}`}>
                <MedicalEntryForm 
                    onClose={closeEntryModal}
                    onSubmit={handleFormSubmit}
                    initialData={editingEntry}
                />
            </Modal>
            <ConfirmationModal
                isOpen={!!deletingEntryId}
                onClose={() => setDeletingEntryId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar esta entrada del historial médico? Esta acción no se puede deshacer."
            />
        </div>
    );
};

interface MedicalHistoryViewProps {
    clients: Client[];
    medicalRecords: MedicalRecordEntry[];
    invoices: Invoice[];
    specialists: Specialist[];
    currentUser: User;
    onAddMedicalRecordEntry: (entryData: Omit<MedicalRecordEntry, 'id'>) => Promise<void>;
    onUpdateMedicalRecordEntry: (entry: MedicalRecordEntry) => Promise<void>;
    onDeleteMedicalRecordEntry: (entryId: string) => Promise<void>;
}

const MedicalHistoryView: React.FC<MedicalHistoryViewProps> = ({ clients, medicalRecords, invoices, specialists, currentUser, onAddMedicalRecordEntry, onUpdateMedicalRecordEntry, onDeleteMedicalRecordEntry }) => {
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const selectedClient = clients.find(c => c.id === selectedClientId);
    
    const handleAddEntry = async (data: Omit<MedicalRecordEntry, 'id' | 'clientId'>) => {
        if (!selectedClientId) return;
        // For admin, specialistId is not set.
        await onAddMedicalRecordEntry({ ...data, clientId: selectedClientId });
    };

    if (selectedClient) {
        return (
            <div className="p-5 animate-fadeIn">
                <MedicalHistoryDetailView 
                    client={selectedClient} 
                    records={medicalRecords.filter(r => r.clientId === selectedClientId)}
                    invoices={invoices}
                    specialists={specialists}
                    currentUser={currentUser}
                    onBack={() => setSelectedClientId(null)} 
                    onAddEntry={handleAddEntry}
                    onUpdateEntry={onUpdateMedicalRecordEntry}
                    onDeleteEntry={onDeleteMedicalRecordEntry}
                />
            </div>
        );
    }
    
    return (
        <div className="p-5 animate-fadeIn">

            {clients.length > 0 ? (
                <div className="space-y-3">
                    {clients.map(client => (
                        <PatientListItem key={client.id} client={client} onSelect={() => setSelectedClientId(client.id)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay pacientes registrados.</p>
                    <p className="text-gray-500">Ve al módulo de 'Clientes' para agregar el primero.</p>
                </div>
            )}
        </div>
    );
};

export default MedicalHistoryView;