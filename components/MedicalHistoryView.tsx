import React, { useState, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, MedicalRecordEntry, Specialist, User, TicketConfig } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, BackIcon, ChevronRightIcon, SparkleIcon, EditIcon, TrashIcon, PdfIcon } from './icons.tsx';
// FIX: Add .ts extension to import path.
import { generateMedicalReport } from '../services/geminiService.ts';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';


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
    
    const [pdfPreview, setPdfPreview] = useState<string | null>(initialData?.pdf || null);
    const [base64Pdf, setBase64Pdf] = useState<string | null>(initialData?.pdf || null);
    const [pdfName, setPdfName] = useState<string | null>(initialData?.pdfName || null);
    const [fileError, setFileError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setFileError("La imagen es muy grande (Máx 5MB).");
                return;
            }
            setFileError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 800; // compress for mobile and speed
                    if (width > height && width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    } else if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                        const result = canvas.toDataURL('image/jpeg', 0.6); // 60% quality JPEG
                        setImagePreview(result);
                        setBase64Image(result);
                    }
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                setFileError("El documento PDF es muy grande para datos móviles (Máx 3MB).");
                return;
            }
            setFileError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPdfPreview(result);
                setBase64Pdf(result);
                setPdfName(file.name);
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
            pdf: base64Pdf || undefined,
            pdfName: pdfName || undefined,
        };
        
        if (initialData) {
            await onSubmit({ ...initialData, ...data });
        } else {
            await onSubmit(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de la Sesión</label>
                <input 
                    type="date" 
                    name="date" 
                    defaultValue={initialData?.date || new Date().toISOString().split('T')[0]} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base" 
                    style={{colorScheme: 'light'}} 
                    required 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Actividad Realizada</label>
                <textarea 
                    name="activityDescription" 
                    rows={2} 
                    defaultValue={initialData?.activityDescription} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej: Ejercicios de integración sensorial táctil con texturas."
                    required 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hitos Esperados</label>
                <textarea 
                    name="expectedMilestones" 
                    rows={2} 
                    defaultValue={initialData?.expectedMilestones} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej: Tolerar texturas rugosas sin presentar hipersensibilidad durante 5 minutos."
                    required 
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Estado del Logro</label>
                <select 
                    name="achievementStatus" 
                    defaultValue={initialData?.achievementStatus} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base"
                >
                    <option value="Logrado">Logrado</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="No Logrado">No Logrado</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas del Terapeuta</label>
                <textarea 
                    name="therapistNotes" 
                    rows={3} 
                    defaultValue={initialData?.therapistNotes} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Detalles adicionales sobre el comportamiento, respuestas y observaciones clínicas del paciente durante la consulta..."
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Anexar Imagen de Evidencia (Opcional)</label>
                <div className="mt-1 flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {imagePreview && (
                        <img src={imagePreview} alt="Evidencia" className="h-16 w-16 rounded-lg object-cover border border-gray-300" />
                    )}
                    <label htmlFor="image-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <span>{imagePreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</span>
                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    {imagePreview && (
                        <button type="button" onClick={() => { setImagePreview(null); setBase64Image(null); }} className="text-sm text-red-600 hover:text-red-850 font-semibold">Eliminar</button>
                    )}
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Anexar PDF (Informes/Exámenes)</label>
                <div className="mt-1 flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {pdfPreview && (
                        <div className="text-blue-600 truncate flex-1 text-sm font-medium">{pdfName || 'Documento PDF'}</div>
                    )}
                    <label htmlFor="pdf-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shrink-0">
                        <span>{pdfPreview ? 'Cambiar PDF' : 'Seleccionar PDF'}</span>
                        <input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept="application/pdf" onChange={handlePdfChange} />
                    </label>
                    {pdfPreview && (
                        <button type="button" onClick={() => { setPdfPreview(null); setBase64Pdf(null); setPdfName(null); }} className="text-sm text-red-600 hover:text-red-850 font-semibold shrink-0">Eliminar</button>
                    )}
                </div>
            </div>
            {fileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-lg">
                    {fileError}
                </div>
            )}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">Guardar Entrada</button>
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
        <div className="space-y-4 text-gray-950">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Instrucciones Adicionales para la IA (Opcional)</label>
                <textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={4} 
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white placeholder-gray-400 text-base" 
                    placeholder="Ej: Describir con rigor académico y lenguaje clínico el progreso en motricidad fina, enfocándose en la evolución de las últimas 5 sesiones."
                />
                 <p className="text-xs text-gray-500 mt-1">Aquí puede orientar a la IA para focalizar el informe en hitos específicos registrados por los terapistas.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200" disabled={isGenerating}>Cancelar</button>
                <button type="button" onClick={handleSubmit} className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 flex items-center space-x-2 disabled:bg-purple-300" disabled={isGenerating}>
                    <SparkleIcon className="w-5 h-5"/>
                    <span>{isGenerating ? 'Generando...' : 'Generar Informe Clínico'}</span>
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
    ticketConfig: TicketConfig;
    onBack: () => void; 
    onAddEntry: (data: Omit<MedicalRecordEntry, 'id' | 'clientId'>) => Promise<void>;
    onUpdateEntry: (entry: MedicalRecordEntry) => Promise<void>;
    onDeleteEntry: (entryId: string) => Promise<void>;
}> = ({ client, records, invoices, specialists, currentUser, ticketConfig, onBack, onAddEntry, onUpdateEntry, onDeleteEntry }) => {
    
    const [isEntryModalOpen, setEntryModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<MedicalRecordEntry | null>(null);
    const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [viewingImage, setViewingImage] = useState<string | null>(null); // State for image viewer

    const handleGenerateReportPdf = () => {
        if (!report) return;
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;
    
        // Header
        const logoWidth = 25;
        if (ticketConfig.logo) {
            try {
                const img = new Image();
                img.src = ticketConfig.logo;
                const aspectRatio = img.width / img.height;
                const logoHeight = logoWidth / aspectRatio;
                doc.addImage(ticketConfig.logo, 'PNG', pageW - margin - logoWidth, y, logoWidth, logoHeight);
            } catch (e) {
                console.error("Error adding logo to PDF", e);
            }
        }
    
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const companyX = margin;
        if (ticketConfig.companyName) doc.text(ticketConfig.companyName, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.companyId) doc.text(`RIF: ${ticketConfig.companyId}`, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.address) doc.text(ticketConfig.address, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.phone) doc.text(`Tel: ${ticketConfig.phone}`, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.email) doc.text(ticketConfig.email, companyX, y, { align: 'left' });

        y += 15;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageW - margin, y);
        y += 10;

        // Title
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME MÉDICO", pageW / 2, y, { align: "center" });
        y += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Paciente: ${client.patientName}`, margin, y);
        y += 5;
        doc.text(`Fecha del Informe: ${new Date().toLocaleDateString()}`, margin, y);
        y += 10;

        // Report Content
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(report, pageW - 2 * margin);
        
        for (let i = 0; i < lines.length; i++) {
            if (y > pageH - margin) {
                doc.addPage();
                y = margin;
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
            }
            doc.text(lines[i], margin, y);
            y += 5; // Adjust line height
        }

        doc.save(`Informe_Medico_${client.patientName.replace(/\s+/g, '_')}.pdf`);
    };

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
            {report && (
                <div className="my-4 bg-white p-6 rounded-xl shadow-md animate-fadeIn flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-lg font-bold text-gray-800">Informe Generado</h4>
                        <button onClick={handleGenerateReportPdf} className="bg-red-600 text-white px-3 py-2 rounded-lg shadow hover:bg-red-700 flex items-center space-x-2">
                            <PdfIcon className="w-5 h-5"/>
                            <span className="font-semibold text-sm">Descargar PDF</span>
                        </button>
                    </div>
                    <textarea 
                        className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-sans leading-relaxed text-gray-700 resize-y"
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                    />
                </div>
            )}


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
                                {record.pdf && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <h4 className="font-semibold text-gray-800">PDF Anexo:</h4>
                                        <a href={record.pdf} download={record.pdfName || 'Documento.pdf'} className="mt-2 inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            <span>Descargar {record.pdfName || 'Documento PDF'}</span>
                                        </a>
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
    ticketConfig: TicketConfig;
    onAddMedicalRecordEntry: (entryData: Omit<MedicalRecordEntry, 'id'>) => Promise<void>;
    onUpdateMedicalRecordEntry: (entry: MedicalRecordEntry) => Promise<void>;
    onDeleteMedicalRecordEntry: (entryId: string) => Promise<void>;
}

const MedicalHistoryView: React.FC<MedicalHistoryViewProps> = ({ clients, medicalRecords, invoices, specialists, currentUser, ticketConfig, onAddMedicalRecordEntry, onUpdateMedicalRecordEntry, onDeleteMedicalRecordEntry }) => {
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
                    ticketConfig={ticketConfig}
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