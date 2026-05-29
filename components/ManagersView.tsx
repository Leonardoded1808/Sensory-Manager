import React, { useState, useMemo } from 'react';
import { Manager, Invoice, ManagerPayout, Client } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
import { AddIcon, EditIcon, TrashIcon, AddPaymentIcon, BackIcon, ChevronRightIcon } from './icons.tsx';


interface ManagerDetails {
    totalPotential: number;
    earnedToDate: number;
    totalPaid: number;
    balanceOwed: number;
}

// --- Sub-components for Manager View ---

const ManagerListItem: React.FC<{
    manager: Manager;
    financials: ManagerDetails;
    onSelect: () => void;
}> = ({ manager, financials, onSelect }) => (
    <div onClick={onSelect} className="bg-white p-4 rounded-xl shadow-md flex justify-between items-center transition-transform hover:scale-105 cursor-pointer">
        <div>
            <p className="font-bold text-lg text-gray-800">{manager.name}</p>
            <p className="text-sm font-semibold text-gray-700">Saldo por Pagar: <span className="font-bold text-red-600">${financials.balanceOwed.toFixed(2)}</span></p>
        </div>
        <div className="text-right">
            <p className="text-xs text-gray-500">Ganancia Potencial</p>
            <p className="font-bold text-green-600">${financials.totalPotential.toFixed(2)}</p>
        </div>
        <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-2" />
    </div>
);


const ManagerDetailView: React.FC<{
    manager: Manager;
    invoices: Invoice[];
    payouts: ManagerPayout[];
    clients: Client[];
    financials: ManagerDetails;
    onBack: () => void;
    onAddPayout: () => void;
    onUpdatePayout: (data: ManagerPayout) => Promise<void>;
    onDeletePayout: (id: string) => Promise<void>;
}> = ({ manager, invoices, payouts, clients, financials, onBack, onAddPayout, onUpdatePayout, onDeletePayout }) => {
    
    const [editingPayout, setEditingPayout] = useState<ManagerPayout | null>(null);
    const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
    const [deletingPayoutId, setDeletingPayoutId] = useState<string | null>(null);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

    const earningsBreakdown = useMemo(() => {
        const owed: { patientName: string; serviceName: string; amount: number; invoiceId: string }[] = [];
        const pending: { patientName: string; serviceName: string; amount: number; invoiceId: string }[] = [];

        invoices.forEach(inv => {
            const earning = inv.managerEarnings?.find(me => me.managerId === manager.id);
            if (earning && inv.price > 0) {
                const client = clientMap.get(inv.clientId);
                if (!client) return;

                const paidRatio = inv.amountPaid / inv.price;
                const earnedAmount = earning.amount * paidRatio;
                const pendingAmount = earning.amount - earnedAmount;

                if (earnedAmount > 0) {
                    owed.push({ patientName: client.patientName, serviceName: inv.serviceName, amount: earnedAmount, invoiceId: inv.id });
                }
                if (pendingAmount > 0.005) { // Threshold for floating point inaccuracies
                    pending.push({ patientName: client.patientName, serviceName: inv.serviceName, amount: pendingAmount, invoiceId: inv.id });
                }
            }
        });
        return { owed, pending };
    }, [manager.id, invoices, clientMap]);

    return (
        <div>
            <button onClick={onBack} className="mb-4 text-blue-600 font-semibold flex items-center space-x-2">
                <BackIcon className="w-5 h-5" />
                <span>Volver a Gerentes</span>
            </button>
            <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-800">{manager.name}</h3>
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
                                        <p className="font-semibold">{item.patientName}</p>
                                        <p className="text-xs text-gray-500">{item.serviceName}</p>
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
                                        <p className="font-semibold">{item.patientName}</p>
                                        <p className="text-xs text-gray-500">{item.serviceName}</p>
                                    </div>
                                    <p className="font-bold text-red-700">${item.amount.toFixed(2)}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500 text-center py-4">No hay comisiones pendientes.</p>}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md mt-6">
                 <h4 className="font-bold text-lg mb-4 text-gray-800">Historial de Pagos</h4>
                 {payouts.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm whitespace-nowrap">
                            <thead className="lowercase tracking-wider text-gray-500 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg font-semibold uppercase tracking-wider text-xs">Fecha</th>
                                    <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs">Monto</th>
                                    <th className="px-4 py-3 rounded-r-lg font-semibold uppercase tracking-wider text-xs text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[...payouts].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payout => (
                                    <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-gray-800">{new Date(payout.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-bold text-green-600">${payout.amount.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right">
                                             <button onClick={() => { setEditingPayout(payout); setIsPayoutModalOpen(true); }} className="text-blue-500 hover:text-blue-700 p-2" title="Editar">
                                                 <EditIcon className="w-4 h-4 inline-block" />
                                             </button>
                                             <button onClick={() => setDeletingPayoutId(payout.id)} className="text-red-500 hover:text-red-700 p-2 ml-1" title="Eliminar">
                                                 <TrashIcon className="w-4 h-4 inline-block" />
                                             </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                 ) : (
                     <p className="text-sm text-gray-500 text-center py-4">No se han registrado pagos para este gerente.</p>
                 )}
            </div>

            <Modal isOpen={isPayoutModalOpen} onClose={() => { setIsPayoutModalOpen(false); setEditingPayout(null); }} title="Editar Pago">
                {editingPayout && (
                     <form onSubmit={async (e) => {
                         e.preventDefault();
                         const formData = new FormData(e.currentTarget);
                         const amount = parseFloat(formData.get('amount') as string);
                         const date = formData.get('date') as string;
                         if (isNaN(amount) || amount <= 0) return alert('Monto inválido');
                         await onUpdatePayout({ ...editingPayout, amount, date });
                         setIsPayoutModalOpen(false);
                         setEditingPayout(null);
                     }} className="space-y-4">
                         <div>
                             <label className="block text-sm font-bold text-gray-300 mb-1">Monto a pagar ($)</label>
                             <input type="number" name="amount" defaultValue={editingPayout.amount} step="0.01" min="0.01" className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                         </div>
                         <div>
                             <label className="block text-sm font-bold text-gray-300 mb-1">Fecha del Pago</label>
                             <input type="date" name="date" defaultValue={editingPayout.date} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                         </div>
                         <div className="flex justify-end space-x-3 pt-4">
                             <button type="button" onClick={() => { setIsPayoutModalOpen(false); setEditingPayout(null); }} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                             <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Actualizar</button>
                         </div>
                     </form>
                )}
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingPayoutId}
                onClose={() => setDeletingPayoutId(null)}
                onConfirm={async () => {
                    if (deletingPayoutId) {
                        await onDeletePayout(deletingPayoutId);
                        setDeletingPayoutId(null);
                    }
                }}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar este pago? Esta acción no se puede deshacer."
            />
        </div>
    );
};


const ManagerForm: React.FC<{
    onClose: () => void;
    onSubmit: (data: Omit<Manager, 'id'>) => Promise<void>;
    initialData?: Manager | null;
}> = ({ onClose, onSubmit, initialData }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = (formData.get('name') as string || '').trim();

        if (!name) {
            alert('El nombre del gerente es obligatorio.');
            return;
        }

        const data = { name };
        await onSubmit(initialData ? { ...initialData, ...data } : data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nombre del Gerente</label>
                <input type="text" name="name" defaultValue={initialData?.name} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
    onSubmit: (payoutData: Omit<ManagerPayout, 'id' | 'managerId'>) => Promise<void>;
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


// --- Main View Component ---

interface ManagersViewProps {
    managers: Manager[];
    invoices: Invoice[];
    managerPayouts: ManagerPayout[];
    clients: Client[];
    onAddManager: (data: Omit<Manager, 'id'>) => Promise<void>;
    onUpdateManager: (data: Manager) => Promise<void>;
    onDeleteManager: (id: string) => Promise<void>;
    onAddPayout: (data: Omit<ManagerPayout, 'id'>) => Promise<void>;
    onUpdatePayout: (data: ManagerPayout) => Promise<void>;
    onDeletePayout: (id: string) => Promise<void>;
}

const ManagersView: React.FC<ManagersViewProps> = (props) => {
    const { managers, invoices, managerPayouts, clients, onAddManager, onUpdateManager, onDeleteManager, onAddPayout, onUpdatePayout, onDeletePayout } = props;

    const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingManager, setEditingManager] = useState<Manager | null>(null);
    const [deletingManagerId, setDeletingManagerId] = useState<string | null>(null);
    const [payoutManagerId, setPayoutManagerId] = useState<string | null>(null);

    const managerFinancials = useMemo(() => {
        const financials = new Map<string, ManagerDetails>();
        managers.forEach(m => financials.set(m.id, { totalPotential: 0, earnedToDate: 0, totalPaid: 0, balanceOwed: 0 }));

        invoices.forEach(invoice => {
            if (invoice.managerEarnings) {
                invoice.managerEarnings.forEach(earning => {
                    if (financials.has(earning.managerId)) {
                        const data = financials.get(earning.managerId)!;
                        data.totalPotential += earning.amount;
                        if (invoice.price > 0) {
                            const paidRatio = invoice.amountPaid / invoice.price;
                            data.earnedToDate += earning.amount * paidRatio;
                        }
                    }
                });
            }
        });

        managerPayouts.forEach(payout => {
            if (financials.has(payout.managerId)) {
                financials.get(payout.managerId)!.totalPaid += payout.amount;
            }
        });

        financials.forEach(data => {
            data.balanceOwed = data.earnedToDate - data.totalPaid;
        });

        return financials;
    }, [managers, invoices, managerPayouts]);

    const selectedManager = useMemo(() => managers.find(m => m.id === selectedManagerId), [managers, selectedManagerId]);

    const handleFormSubmit = async (data: Omit<Manager, 'id'>) => {
        if (editingManager) {
            await onUpdateManager({ ...editingManager, ...data });
        } else {
            await onAddManager(data);
        }
        setIsFormModalOpen(false);
        setEditingManager(null);
    };
    
    const handlePayoutSubmit = async (payoutData: Omit<ManagerPayout, 'id' | 'managerId'>) => {
        if (payoutManagerId) {
            await onAddPayout({ ...payoutData, managerId: payoutManagerId });
        }
        setPayoutManagerId(null);
    };

    const confirmDelete = async () => {
        if (deletingManagerId) {
            await onDeleteManager(deletingManagerId);
            setDeletingManagerId(null);
        }
    };
    
    if (selectedManager) {
        return (
            <div className="p-5 animate-fadeIn">
                <ManagerDetailView 
                    manager={selectedManager}
                    invoices={invoices}
                    payouts={managerPayouts.filter(p => p.managerId === selectedManager.id)}
                    clients={clients}
                    financials={managerFinancials.get(selectedManager.id)!}
                    onBack={() => setSelectedManagerId(null)}
                    onAddPayout={() => setPayoutManagerId(selectedManager.id)}
                    onUpdatePayout={onUpdatePayout}
                    onDeletePayout={onDeletePayout}
                />

                <Modal isOpen={!!payoutManagerId} onClose={() => setPayoutManagerId(null)} title={`Registrar Pago a ${managers.find(m=>m.id === payoutManagerId)?.name}`}>
                    {payoutManagerId && (
                        <PayoutForm 
                            onClose={() => setPayoutManagerId(null)}
                            onSubmit={handlePayoutSubmit}
                            maxAmount={managerFinancials.get(payoutManagerId)?.balanceOwed || 0}
                        />
                    )}
                </Modal>
            </div>
        )
    }

    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
                <button onClick={() => { setEditingManager(null); setIsFormModalOpen(true);}} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Agregar Gerente</span>
                </button>
            </div>

            {managers.length > 0 ? (
                <div className="space-y-3">
                    {managers.map(manager => {
                        const financials = managerFinancials.get(manager.id)!;
                        return (
                             <ManagerListItem 
                                key={manager.id} 
                                manager={manager} 
                                financials={financials}
                                onSelect={() => setSelectedManagerId(manager.id)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay gerentes registrados.</p>
                    <p className="text-gray-500">Presiona 'Agregar Gerente' para crear el primero.</p>
                </div>
            )}
            
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingManager ? "Editar Gerente" : "Agregar Nuevo Gerente"}>
                <ManagerForm 
                    onClose={() => setIsFormModalOpen(false)} 
                    onSubmit={handleFormSubmit}
                    initialData={editingManager}
                />
            </Modal>
            
            <Modal isOpen={!!payoutManagerId} onClose={() => setPayoutManagerId(null)} title={`Registrar Pago a ${managers.find(m=>m.id === payoutManagerId)?.name}`}>
                {payoutManagerId && (
                    <PayoutForm 
                        onClose={() => setPayoutManagerId(null)}
                        onSubmit={handlePayoutSubmit}
                        maxAmount={managerFinancials.get(payoutManagerId)?.balanceOwed || 0}
                    />
                )}
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingManagerId}
                onClose={() => setDeletingManagerId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Está seguro? Se eliminará al gerente. Las ganancias pasadas seguirán registradas, pero no podrá ser asignado a nuevas facturas."
            />
        </div>
    );
};

export default ManagersView;