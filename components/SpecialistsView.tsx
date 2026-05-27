import React, { useState, useMemo } from 'react';
import { Specialist, Service, Invoice, SpecialistPayout } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
import { AddIcon, EditIcon, TrashIcon, DownloadIcon, BackIcon, AddPaymentIcon, ChevronRightIcon } from './icons.tsx';

interface SpecialistDetails {
    totalPotential: number;
    earnedToDate: number;
    totalPaid: number;
    balanceOwed: number;
}

interface SpecialistListItemProps {
    specialist: Specialist;
    services: Service[];
    financials: SpecialistDetails;
    onSelect: () => void;
    onEdit: (e: React.MouseEvent) => void;
    onDelete: (e: React.MouseEvent) => void;
    onExport: (e: React.MouseEvent) => void;
}

const SpecialistListItem: React.FC<SpecialistListItemProps> = ({ specialist, services, financials, onSelect, onEdit, onDelete, onExport }) => {
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
        <div onClick={onSelect} className="bg-white p-4 rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <p className="font-bold text-lg text-gray-800">{specialist.name}</p>
                    <p className="text-sm text-gray-500">{specialistServices}</p>
                </div>
                <div className="text-right flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Saldo por Pagar</p>
                        <p className="font-bold text-red-600">${financials.balanceOwed.toFixed(2)}</p>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
            </div>
            <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-100">
                <div className="text-xs text-gray-500">
                    Ganancia Potencial: <span className="font-bold text-green-600">${financials.totalPotential.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button onClick={onExport} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors" title="Exportar Datos">
                        <DownloadIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar">
                        <EditIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Eliminar">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const SpecialistDetailView: React.FC<{
    specialist: Specialist;
    invoices: Invoice[];
    payouts: SpecialistPayout[];
    financials: SpecialistDetails;
    onBack: () => void;
    onAddPayout: () => void;
}> = ({ specialist, invoices, payouts, financials, onBack, onAddPayout }) => {
    
    const earningsBreakdown = useMemo(() => {
        const owed: { serviceName: string; amount: number; invoiceId: string }[] = [];
        const pending: { serviceName: string; amount: number; invoiceId: string }[] = [];

        invoices.forEach(inv => {
            if (inv.specialistId === specialist.id && inv.specialistEarnings && inv.price > 0) {
                const paidRatio = inv.amountPaid / inv.price;
                const earnedAmount = inv.specialistEarnings * paidRatio;
                const pendingAmount = inv.specialistEarnings - earnedAmount;

                if (earnedAmount > 0) {
                    owed.push({ serviceName: inv.serviceName, amount: earnedAmount, invoiceId: inv.id });
                }
                if (pendingAmount > 0.005) {
                    pending.push({ serviceName: inv.serviceName, amount: pendingAmount, invoiceId: inv.id });
                }
            }
        });
        return { owed, pending };
    }, [specialist.id, invoices]);

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-blue-600 font-semibold flex items-center space-x-2">
                <BackIcon className="w-5 h-5" />
                <span>Volver a Especialistas</span>
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">{specialist.name}</h3>
                    <button onClick={onAddPayout} className="bg-green-600 text-white px-3 py-2 rounded-lg shadow hover:bg-green-700 flex items-center space-x-2">
                        <AddPaymentIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">Registrar Pago</span>
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-sm text-gray-500">Ganancia Potencial</p>
                        <p className="font-bold text-xl text-green-600">${financials.totalPotential.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Ganado (por cobrar)</p>
                        <p className="font-bold text-xl text-yellow-600">${financials.earnedToDate.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Total Pagado</p>
                        <p className="font-bold text-xl text-blue-600">${financials.totalPaid.toFixed(2)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">SALDO A DEBER</p>
                        <p className="font-extrabold text-2xl text-red-600">${financials.balanceOwed.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-xl shadow-md">
                    <h4 className="font-bold text-lg mb-2">Comisiones Por Pagar</h4>
                    {earningsBreakdown.owed.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {earningsBreakdown.owed.map((item, i) => (
                                <li key={`${item.invoiceId}-${i}`} className="flex justify-between items-center text-sm p-2 bg-yellow-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-700">{item.serviceName}</p>
                                    </div>
                                    <p className="font-bold text-yellow-700">${item.amount.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 text-center py-4">No hay comisiones por pagar.</p>}
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-md">
                    <h4 className="font-bold text-lg mb-2">Comisiones Pendientes de Cliente</h4>
                     {earningsBreakdown.pending.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {earningsBreakdown.pending.map((item, i) => (
                                <li key={`${item.invoiceId}-${i}`} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded-md">
                                    <div>
                                        <p className="font-semibold text-gray-700">{item.serviceName}</p>
                                    </div>
                                    <p className="font-bold text-red-700">${item.amount.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 text-center py-4">No hay comisiones pendientes.</p>}
                </div>
            </div>
        </div>
    );
};

const SpecialistForm: React.FC<{
    onClose: () => void;
    onSubmit: (data: Omit<Specialist, 'id'> | Specialist) => Promise<void>;
    initialData?: Specialist | null;
    services: Service[];
}> = ({ onClose, onSubmit, initialData, services }) => {
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

const PayoutForm: React.FC<{
    onClose: () => void;
    onSubmit: (payoutData: Omit<SpecialistPayout, 'id' | 'specialistId'>) => Promise<void>;
    maxAmount: number;
}> = ({ onClose, onSubmit, maxAmount }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        if (isNaN(amount) || amount <= 0 || amount > maxAmount) {
            alert(`Por favor, ingrese un monto de pago válido, mayor a 0 y no mayor al saldo de $${maxAmount.toFixed(2)}.`);
            return;
        }
        const data = {
            amount,
            date: formData.get('date') as string,
            notes: formData.get('notes') as string,
        };
        await onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Monto del Pago</label>
                <input type="number" name="amount" step="0.01" min="0.01" max={maxAmount.toFixed(2)} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" required autoFocus/>
            </div>
             <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Fecha del Pago</label>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" style={{colorScheme: 'dark'}} required />
            </div>
             <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Notas (Opcional)</label>
                <textarea name="notes" rows={2} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" placeholder="Ej: Pago de comisiones Q1"/>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">Registrar Pago</button>
            </div>
        </form>
    );
};

interface SpecialistsViewProps {
    specialists: Specialist[];
    services: Service[];
    invoices: Invoice[];
    specialistPayouts: SpecialistPayout[];
    onAddSpecialist: (data: Omit<Specialist, 'id'>) => Promise<void>;
    onUpdateSpecialist: (data: Specialist) => Promise<void>;
    onDeleteSpecialist: (id: string) => Promise<void>;
    onExportForSpecialist: (id: string) => void;
    onAddPayout: (data: Omit<SpecialistPayout, 'id'>) => Promise<void>;
}

const SpecialistsView: React.FC<SpecialistsViewProps> = ({ specialists, services, invoices, specialistPayouts, onAddSpecialist, onUpdateSpecialist, onDeleteSpecialist, onExportForSpecialist, onAddPayout }) => {
    const [selectedSpecialistId, setSelectedSpecialistId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
    const [deletingSpecialistId, setDeletingSpecialistId] = useState<string | null>(null);
    const [payoutSpecialistId, setPayoutSpecialistId] = useState<string | null>(null);

    const specialistFinancials = useMemo(() => {
        const financials = new Map<string, SpecialistDetails>();
        specialists.forEach(s => financials.set(s.id, { totalPotential: 0, earnedToDate: 0, totalPaid: 0, balanceOwed: 0 }));

        invoices.forEach(invoice => {
            if (invoice.specialistId && invoice.specialistEarnings && financials.has(invoice.specialistId)) {
                const data = financials.get(invoice.specialistId)!;
                data.totalPotential += invoice.specialistEarnings;
                if (invoice.price > 0) {
                    const paidRatio = invoice.amountPaid / invoice.price;
                    data.earnedToDate += invoice.specialistEarnings * paidRatio;
                }
            }
        });

        specialistPayouts.forEach(payout => {
            if (financials.has(payout.specialistId)) {
                financials.get(payout.specialistId)!.totalPaid += payout.amount;
            }
        });

        financials.forEach(data => {
            data.balanceOwed = data.earnedToDate - data.totalPaid;
        });

        return financials;
    }, [specialists, invoices, specialistPayouts]);

    const selectedSpecialist = useMemo(() => specialists.find(s => s.id === selectedSpecialistId), [specialists, selectedSpecialistId]);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSpecialist(null);
    };

    const handleFormSubmit = async (data: Omit<Specialist, 'id'> | Specialist) => {
        if ('id' in data) {
            await onUpdateSpecialist(data);
        } else {
            await onAddSpecialist(data);
        }
        closeModal();
    };

    const handlePayoutSubmit = async (payoutData: Omit<SpecialistPayout, 'id' | 'specialistId'>) => {
        if (payoutSpecialistId) {
            await onAddPayout({ ...payoutData, specialistId: payoutSpecialistId });
        }
        setPayoutSpecialistId(null);
    };

    const confirmDelete = async () => {
        if (deletingSpecialistId) {
            await onDeleteSpecialist(deletingSpecialistId);
            setDeletingSpecialistId(null);
        }
    };
    
    if (selectedSpecialist) {
        return (
            <div className="p-5 animate-fadeIn">
                <SpecialistDetailView 
                    specialist={selectedSpecialist}
                    invoices={invoices}
                    payouts={specialistPayouts.filter(p => p.specialistId === selectedSpecialist.id)}
                    financials={specialistFinancials.get(selectedSpecialist.id)!}
                    onBack={() => setSelectedSpecialistId(null)}
                    onAddPayout={() => setPayoutSpecialistId(selectedSpecialist.id)}
                />

                <Modal isOpen={!!payoutSpecialistId} onClose={() => setPayoutSpecialistId(null)} title={`Registrar Pago a ${specialists.find(s=>s.id === payoutSpecialistId)?.name}`}>
                    {payoutSpecialistId && (
                        <PayoutForm 
                            onClose={() => setPayoutSpecialistId(null)}
                            onSubmit={handlePayoutSubmit}
                            maxAmount={specialistFinancials.get(payoutSpecialistId)?.balanceOwed || 0}
                        />
                    )}
                </Modal>
            </div>
        )
    }

    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
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
                            financials={specialistFinancials.get(specialist.id)!}
                            onSelect={() => setSelectedSpecialistId(specialist.id)}
                            onEdit={(e) => { e.stopPropagation(); setEditingSpecialist(specialist); setIsModalOpen(true); }}
                            onDelete={(e) => { e.stopPropagation(); setDeletingSpecialistId(specialist.id); }}
                            onExport={(e) => { e.stopPropagation(); onExportForSpecialist(specialist.id); }}
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
