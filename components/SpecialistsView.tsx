
import React, { useState, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Specialist, Service } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, EditIcon, TrashIcon, DownloadIcon } from './icons.tsx';

interface SpecialistListItemProps {
    specialist: Specialist;
    services: Service[];
    onEdit: () => void;
    onDelete: () => void;
    onExport: () => void;
}

const SpecialistListItem: React.FC<SpecialistListItemProps> = ({ specialist, services, onEdit, onDelete, onExport }) => {
    const specialistServices = useMemo(() => {
        const serviceNames = services
            .filter(s => specialist.serviceIds.includes(s.id))
            .map(s => s.serviceName);
        if (serviceNames.length > 3) {
            return `${serviceNames.slice(0, 3).join(', ')}, y ${serviceNames.length - 3} más`;
        }
        return serviceNames.join(', ') || 'Sin servicios asignados';
    }, [specialist.serviceIds, services]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-800">{specialist.name}</p>
                    <p className="text-sm text-gray-500">{specialistServices}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={onExport} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Exportar Datos del Especialista">
                        <DownloadIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};


interface SpecialistFormProps {
    onClose: () => void;
    onSubmit: (data: Omit<Specialist, 'id'> | Specialist) => Promise<void>;
    initialData?: Specialist | null;
    services: Service[];
}

const SpecialistForm: React.FC<SpecialistFormProps> = ({ onClose, onSubmit, initialData, services }) => {
    const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.serviceIds || []);
    
    const handleServiceToggle = (serviceId: string) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = (formData.get('name') as string || '').trim();
        
        if (!name) {
            alert('El nombre del especialista es obligatorio.');
            return;
        }

        const data = { name, serviceIds: selectedServices };
        
        if (initialData) {
            await onSubmit({ ...initialData, ...data });
        } else {
            await onSubmit(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nombre del Especialista</label>
                <input type="text" name="name" defaultValue={initialData?.name} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Servicios que Ofrece</label>
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-700 border border-slate-600 rounded-lg">
                    {services.length > 0 ? services.map(service => (
                        <div key={service.id} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={`service-${service.id}`} 
                                value={service.id}
                                checked={selectedServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`service-${service.id}`} className="ml-3 block text-sm text-gray-200">{service.serviceName}</label>
                        </div>
                    )) : <p className="text-sm text-gray-400">No hay servicios creados. Por favor, agregue servicios primero.</p>}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    );
};


interface SpecialistsViewProps {
    specialists: Specialist[];
    services: Service[];
    onAddSpecialist: (data: Omit<Specialist, 'id'>) => Promise<void>;
    onUpdateSpecialist: (data: Specialist) => Promise<void>;
    onDeleteSpecialist: (id: string) => Promise<void>;
    onExportForSpecialist: (id: string) => void;
}

const SpecialistsView: React.FC<SpecialistsViewProps> = ({ specialists, services, onAddSpecialist, onUpdateSpecialist, onDeleteSpecialist, onExportForSpecialist }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
    const [deletingSpecialistId, setDeletingSpecialistId] = useState<string | null>(null);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSpecialist(null);
    };

    const handleOpenAddModal = () => {
        setEditingSpecialist(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (specialist: Specialist) => {
        setEditingSpecialist(specialist);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (id: string) => {
        setDeletingSpecialistId(id);
    };

    const confirmDelete = async () => {
        if (deletingSpecialistId) {
            await onDeleteSpecialist(deletingSpecialistId);
            setDeletingSpecialistId(null);
        }
    };
    
    const handleFormSubmit = async (data: Omit<Specialist, 'id'> | Specialist) => {
        if ('id' in data) {
            await onUpdateSpecialist(data);
        } else {
            await onAddSpecialist(data);
        }
        closeModal();
    };

    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenAddModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Agregar</span>
                </button>
            </div>

            {specialists.length > 0 ? (
                <div className="space-y-3">
                    {specialists.map(specialist => (
                        <SpecialistListItem 
                            key={specialist.id} 
                            specialist={specialist} 
                            services={services}
                            onEdit={() => handleOpenEditModal(specialist)}
                            onDelete={() => handleDeleteRequest(specialist.id)}
                            onExport={() => onExportForSpecialist(specialist.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay especialistas registrados.</p>
                    <p className="text-gray-500">Presiona 'Agregar' para crear el primero.</p>
                </div>
            )}
            
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSpecialist ? "Editar Especialista" : "Agregar Especialista"}>
                <SpecialistForm 
                    onClose={closeModal} 
                    onSubmit={handleFormSubmit}
                    initialData={editingSpecialist}
                    services={services}
                />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingSpecialistId}
                onClose={() => setDeletingSpecialistId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar a este especialista? Se desvinculará de todas las facturas, pero no se eliminarán las facturas."
            />
        </div>
    );
};

export default SpecialistsView;