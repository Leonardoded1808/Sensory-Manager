

import React, { useState } from 'react';
// FIX: Add .ts extension to import path.
import { Invoice, Service } from '../types.ts';
import Modal from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, EditIcon, TrashIcon } from './icons.tsx';

interface ServiceListItemProps {
    service: Service;
    onEdit: () => void;
    onDelete: () => void;
}
const ServiceListItem: React.FC<ServiceListItemProps> = ({ service, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-lg text-gray-800">{service.serviceName}</p>
                <p className="text-sm text-gray-500">{service.billingType}</p>
            </div>
            <p className="font-extrabold text-lg text-green-600">${service.price}</p>
        </div>
        <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
             <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
                <EditIcon className="w-5 h-5"/>
            </button>
            <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
                <TrashIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
);


interface ServiceFormProps {
    onClose: () => void;
    onSubmit: (serviceData: Omit<Service, 'id' | 'createdAt'> | Service) => Promise<void>;
    initialData?: Service | null;
}
const ServiceForm: React.FC<ServiceFormProps> = ({ onClose, onSubmit, initialData }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const priceValue = formData.get('price') as string;
        const price = parseFloat(priceValue);

        if (isNaN(price) || price < 0) {
            alert('Por favor, ingrese un precio válido y positivo.');
            return;
        }

        const data = {
            serviceName: formData.get('serviceName') as string,
            price: price,
            billingType: formData.get('billingType') as 'Mensualidad' | 'Paquete de Sesiones' | 'Por Sesión',
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
                <label className="block text-sm font-bold text-gray-300 mb-1">Nombre del Servicio</label>
                <input type="text" name="serviceName" defaultValue={initialData?.serviceName} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Precio</label>
                    <input type="number" name="price" step="0.01" min="0" defaultValue={initialData?.price} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Tipo de Cobro</label>
                    <select name="billingType" defaultValue={initialData?.billingType} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Mensualidad">Mensualidad</option>
                        <option value="Paquete de Sesiones">Paquete de Sesiones</option>
                        <option value="Por Sesión">Por Sesión</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    );
};


interface ServicesViewProps {
    services: Service[];
    invoices: Invoice[];
    onAddService: (serviceData: Omit<Service, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateService: (service: Service) => Promise<void>;
    onDeleteService: (serviceId: string) => Promise<void>;
}

const ServicesView: React.FC<ServicesViewProps> = ({ services, onAddService, onUpdateService, onDeleteService }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const handleOpenModalForAdd = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    const handleDelete = (serviceId: string) => {
        if (window.confirm("¿Está seguro de que desea eliminar este servicio? Esta acción no se puede deshacer.")) {
            onDeleteService(serviceId);
        }
    };

    const handleFormSubmit = async (data: Omit<Service, 'id' | 'createdAt'> | Service) => {
        if ('id' in data) {
            await onUpdateService(data);
        } else {
            await onAddService(data);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="p-5 animate-fadeIn">
             <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Agregar</span>
                </button>
            </div>

            {services.length > 0 ? (
                <div className="space-y-3">
                    {services.map(service => (
                        <ServiceListItem 
                            key={service.id} 
                            service={service} 
                            onEdit={() => handleOpenModalForEdit(service)}
                            onDelete={() => handleDelete(service.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay servicios registrados.</p>
                    <p className="text-gray-500">Presiona 'Agregar' para crear el primero.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingService ? "Editar Servicio" : "Agregar Nuevo Servicio"}>
                <ServiceForm 
                    onClose={() => setIsModalOpen(false)} 
                    onSubmit={handleFormSubmit}
                    initialData={editingService}
                />
            </Modal>
        </div>
    );
};

export default ServicesView;