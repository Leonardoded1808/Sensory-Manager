import React, { useState, useRef } from 'react';
// FIX: Add .ts extension to import path.
import { TicketConfig, WhatsAppTemplate, Specialist } from '../types.ts';
// FIX: Add .tsx extension to import path.
import { DownloadIcon, UploadIcon, DatabaseIcon, TrashIcon, AddIcon } from './icons.tsx';
import { ConfirmationModal } from './Modal.tsx';
import { v4 as uuidv4 } from 'uuid';

const PasswordChangeForm: React.FC<{ onUpdateAdminPassword: (oldPass: string, newPass: string) => Promise<boolean>; }> = ({ onUpdateAdminPassword }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmNewPassword) {
            alert("Las nuevas contraseñas no coinciden.");
            return;
        }
        if (newPassword.length < 8) {
            alert("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }
        setIsSaving(true);
        const success = await onUpdateAdminPassword(oldPassword, newPassword);
        if (success) {
            setOldPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        }
        setIsSaving(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contraseña Actual</label>
                    <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nueva Contraseña</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña</label>
                    <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm" />
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                    {isSaving ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
            </div>
        </form>
    );
};

interface ManagementViewProps {
    initialConfig: TicketConfig;
    whatsappTemplates: WhatsAppTemplate[];
    specialists: Specialist[];
    onSave: (config: TicketConfig) => Promise<void>;
    onSaveTemplates: (templates: WhatsAppTemplate[]) => Promise<void>;
    onExport: () => void;
    onImport: (data: string) => void;
    onImportSpecialistData: (data: string) => void;
    onExportSpecialistJSON: (id: string) => void;
    onUpdateAdminPassword: (oldPass: string, newPass: string) => Promise<boolean>;
}

const ManagementView: React.FC<ManagementViewProps> = ({ initialConfig, whatsappTemplates, specialists, onSave, onSaveTemplates, onExport, onImport, onImportSpecialistData, onExportSpecialistJSON, onUpdateAdminPassword }) => {
    const [config, setConfig] = useState<TicketConfig>(initialConfig);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>(whatsappTemplates);
    const [logoPreview, setLogoPreview] = useState<string | undefined>(initialConfig.logo);
    const [isSaving, setIsSaving] = useState(false);
    
    const [selectedExportSpecialistId, setSelectedExportSpecialistId] = useState<string>('');
    
    const backupFileInputRef = useRef<HTMLInputElement>(null);
    const specialistFileInputRef = useRef<HTMLInputElement>(null);

    const [isBackupConfirmModalOpen, setBackupConfirmModalOpen] = useState(false);
    const [pendingBackupImportData, setPendingBackupImportData] = useState<string | null>(null);

    const [isSpecialistConfirmModalOpen, setSpecialistConfirmModalOpen] = useState(false);
    const [pendingSpecialistImportData, setPendingSpecialistImportData] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setConfig(prev => ({ ...prev, logo: base64String }));
                setLogoPreview(base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(config);
        setIsSaving(false);
    };

    const handleImportClick = (type: 'backup' | 'specialist') => {
        if (type === 'backup') {
            backupFileInputRef.current?.click();
        } else {
            specialistFileInputRef.current?.click();
        }
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'backup' | 'specialist') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (type === 'backup') {
                    setPendingBackupImportData(content);
                    setBackupConfirmModalOpen(true);
                } else {
                    setPendingSpecialistImportData(content);
                    setSpecialistConfirmModalOpen(true);
                }
            };
            reader.readAsText(file);
        }
        if (e.target) e.target.value = '';
    };

    const confirmBackupImport = () => {
        if (pendingBackupImportData) onImport(pendingBackupImportData);
        setBackupConfirmModalOpen(false);
        setPendingBackupImportData(null);
    };

    const confirmSpecialistImport = () => {
        if (pendingSpecialistImportData) onImportSpecialistData(pendingSpecialistImportData);
        setSpecialistConfirmModalOpen(false);
        setPendingSpecialistImportData(null);
    };

    const handleAddTemplate = () => {
        setTemplates([...templates, { id: uuidv4(), title: 'Nueva Plantilla', template: '' }]);
    };

    const handleTemplateChange = (id: string, field: keyof WhatsAppTemplate, value: string) => {
        setTemplates(templates.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const handleDeleteTemplate = (id: string) => {
        setTemplates(templates.filter(t => t.id !== id));
    };

    const handleSaveTemplatesClick = async () => {
        setIsSaving(true);
        await onSaveTemplates(templates);
        setIsSaving(false);
    };

    return (
        <div className="p-5 animate-fadeIn space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Configuración de Ticket/Recibo</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la Empresa</label>
                        <div className="mt-1 flex items-center space-x-6">
                            <span className="inline-block h-20 w-20 rounded-lg overflow-hidden bg-gray-100">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain" />
                                ) : (
                                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.997A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                )}
                            </span>
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                <span>Cambiar</span>
                                <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                            <input type="text" name="companyName" value={config.companyName || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">RIF / ID de la Empresa</label>
                            <input type="text" name="companyId" value={config.companyId || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input type="tel" name="phone" value={config.phone || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <input type="email" name="email" value={config.email || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Dirección</label>
                            <input type="text" name="address" value={config.address || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Información Adicional (Ej: Datos bancarios)</label>
                            <textarea name="additionalInfo" rows={3} value={config.additionalInfo || ''} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Pie de Página</label>
                            <input type="text" name="footer" value={config.footer || ''} onChange={handleInputChange} placeholder="Ej: Gracias por su confianza" className="mt-1 block w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isSaving} className="w-full md:w-auto inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Plantillas de WhatsApp</h3>
                <p className="text-sm text-gray-500 mb-6">Configure los mensajes predeterminados para enviar a los pacientes. Variables disponibles: {"{{representante}}, {{paciente}}, {{fecha}}, {{hora}}"}</p>
                
                <div className="space-y-4">
                    {templates.map((template) => (
                        <div key={template.id} className="border border-gray-200 p-4 rounded-xl relative">
                            <div className="flex justify-between items-start mb-2">
                                <input
                                    type="text"
                                    value={template.title}
                                    onChange={(e) => handleTemplateChange(template.id, 'title', e.target.value)}
                                    placeholder="Título (Ej. Recordatorio, Cumpleaños...)"
                                    className="font-bold text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-2 rounded-lg text-base w-full shadow-sm mr-2"
                                />
                                <button type="button" onClick={() => handleDeleteTemplate(template.id)} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                            <textarea
                                value={template.template}
                                onChange={(e) => handleTemplateChange(template.id, 'template', e.target.value)}
                                rows={3}
                                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Escriba su mensaje aquí..."
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-between items-center">
                    <button type="button" onClick={handleAddTemplate} className="flex items-center space-x-2 text-blue-600 font-semibold hover:bg-blue-50 py-2 px-3 rounded-lg transition-colors">
                        <AddIcon className="w-5 h-5"/> <span>Añadir Plantilla</span>
                    </button>
                    <button type="button" onClick={handleSaveTemplatesClick} disabled={isSaving} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300">
                        {isSaving ? 'Guardando...' : 'Guardar Plantillas'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Cambiar Contraseña de Administrador</h3>
                <PasswordChangeForm onUpdateAdminPassword={onUpdateAdminPassword} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Copia de Seguridad (Admin)</h3>
                <p className="text-sm text-gray-500 mb-6">Exporte todos los datos de su aplicación en un solo archivo para guardarlo de forma segura. Puede importar este archivo más tarde para restaurar toda la información.</p>
                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={onExport} className="flex-1 inline-flex justify-center items-center gap-2 py-3 px-4 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                        <DownloadIcon className="w-5 h-5"/> Exportar Datos
                    </button>
                    <button onClick={() => handleImportClick('backup')} className="flex-1 inline-flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 shadow-sm text-sm font-bold rounded-lg text-gray-700 bg-gray-50 hover:bg-gray-100">
                        <UploadIcon className="w-5 h-5"/> Importar Respaldo
                    </button>
                    <input type="file" ref={backupFileInputRef} onChange={(e) => handleImportFile(e, 'backup')} accept=".json" className="hidden"/>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Datos de Especialistas</h3>
                <p className="text-sm text-gray-500 mb-6">Importe los archivos de historial médico exportados por los especialistas, o exporte los datos para un especialista específico (incluirá pacientes y citas asignadas) sin sobreescribir datos anteriores de la plataforma.</p>
                <div className="flex flex-col gap-4">
                    <button onClick={() => handleImportClick('specialist')} className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 border border-purple-300 shadow-sm text-sm font-bold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">
                        <DatabaseIcon className="w-5 h-5"/> Importar Datos Recibidos de Especialista
                    </button>
                    <input type="file" ref={specialistFileInputRef} onChange={(e) => handleImportFile(e, 'specialist')} accept=".json" className="hidden"/>

                    <div className="h-px bg-gray-200 w-full my-2"></div>

                    <div className="flex flex-col md:flex-row gap-4 items-center mt-2">
                        <select 
                            value={selectedExportSpecialistId} 
                            onChange={(e) => setSelectedExportSpecialistId(e.target.value)}
                            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Seleccione un especialista...</option>
                            {specialists.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <button 
                            onClick={() => {
                                if (selectedExportSpecialistId) {
                                    onExportSpecialistJSON(selectedExportSpecialistId);
                                    setSelectedExportSpecialistId('');
                                } else {
                                    alert('Debe seleccionar un especialista primero.');
                                }
                            }}
                            className="w-full md:w-auto inline-flex justify-center items-center gap-2 py-3 px-6 border border-transparent shadow-sm text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <DownloadIcon className="w-5 h-5"/> Exportar Datos para Especialista
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal isOpen={isBackupConfirmModalOpen} onClose={() => setBackupConfirmModalOpen(false)} onConfirm={confirmBackupImport} title="Confirmar Importación de Respaldo" message="¿Está seguro? Se sobrescribirán todos los datos actuales. Esta acción no se puede deshacer." confirmText="Sí, Importar Respaldo"/>
            <ConfirmationModal isOpen={isSpecialistConfirmModalOpen} onClose={() => setSpecialistConfirmModalOpen(false)} onConfirm={confirmSpecialistImport} title="Confirmar Importación de Datos" message="Se agregarán las nuevas entradas de historial del especialista. Las entradas existentes no se modificarán. ¿Desea continuar?" confirmText="Sí, Importar"/>
        </div>
    );
};

export default ManagementView;