import React, { useState, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice } from '../types.ts';
// FIX: Add .ts extension to import path.
import { calculateAllDebts } from '../services/debtService.ts';

const DebtView: React.FC<{ clients: Client[]; invoices: Invoice[] }> = ({ clients, invoices }) => {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredInvoices = useMemo(() => {
        if (!startDate && !endDate) {
            return invoices;
        }

        const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

        return invoices.filter(inv => {
            const invDate = new Date(inv.createdAt);
            if (start && invDate < start) return false;
            if (end && invDate > end) return false;
            return true;
        });
    }, [startDate, endDate, invoices]);

    const debts = calculateAllDebts(clients, filteredInvoices);

    const hasActiveFilter = startDate || endDate;

    return (
        <div className="p-5 animate-fadeIn">
            <div className="bg-white p-4 rounded-xl shadow-md space-y-4 mb-6">
                <h3 className="text-lg font-bold text-gray-800">Filtrar por Período de Creación del Recibo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="start-date-debt" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input 
                            type="date" 
                            id="start-date-debt"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            style={{colorScheme: 'light'}}
                            max={endDate || undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date-debt" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input 
                            type="date" 
                            id="end-date-debt"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            style={{colorScheme: 'light'}}
                            min={startDate || undefined}
                        />
                    </div>
                    <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors w-full h-10"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            {debts.length > 0 ? (
                <div className="space-y-4">
                    {debts.map(debtInfo => (
                        <div key={debtInfo.client.id} className="bg-white p-4 rounded-xl shadow-md border-l-4 border-red-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg text-gray-800">{debtInfo.client.representativeName}</p>
                                    <p className="text-sm text-gray-500">Paciente: {debtInfo.client.patientName}</p>
                                </div>
                                <p className="font-extrabold text-xl text-red-600">${debtInfo.totalDebt.toFixed(2)}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="font-semibold text-gray-600 mb-2">Recibos Pendientes:</h4>
                                <ul className="space-y-2 text-sm">
                                    {debtInfo.pendingInvoices.map((invoice) => (
                                        <li key={invoice.id} className="flex justify-between p-2 bg-red-50 rounded-md">
                                            <div>
                                                <span className="font-medium">{invoice.serviceName}</span>
                                                <span className="text-gray-500 ml-2">
                                                    ({new Date(invoice.createdAt).toLocaleDateString('es-ES')})
                                                </span>
                                            </div>
                                            <span className="font-bold text-red-700">Saldo: ${invoice.balance.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">
                        {hasActiveFilter 
                            ? "No hay deudas pendientes en el período seleccionado."
                            : "¡Excelente! Todos los clientes están al día."
                        }
                    </p>
                    <p className="text-gray-500">
                        {hasActiveFilter
                            ? "Pruebe ajustar el rango de fechas o limpiar los filtros."
                            : "No hay deudas pendientes registradas."
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default DebtView;