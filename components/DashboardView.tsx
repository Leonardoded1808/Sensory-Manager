import React, { useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, Expense, Service, Appointment } from '../types.ts';

interface DashboardViewProps {
    clients: Client[];
    invoices: Invoice[];
    expenses: Expense[];
    services: Service[];
    appointments: Appointment[];
}

const StatCard: React.FC<{ title: string; value: string; subtext?: string; }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = ({ clients, invoices, expenses }) => {
    
    const stats = useMemo(() => {
        const totalIncome = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalDebt = invoices.reduce((sum, inv) => sum + inv.balance, 0);

        return {
            totalClients: clients.length,
            totalInvoices: invoices.length,
            totalIncome: totalIncome.toFixed(2),
            totalDebt: totalDebt.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2)
        };
    }, [clients, invoices, expenses]);

    const recentInvoices = useMemo(() => {
        return [...invoices]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [invoices]);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.patientName])), [clients]);


    return (
        <div className="p-5 animate-fadeIn space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Ingresos Totales" value={`$${stats.totalIncome}`} />
                <StatCard title="Balance Neto" value={`$${stats.netBalance}`} subtext="Ingresos - Gastos" />
                <StatCard title="Deuda Pendiente" value={`$${stats.totalDebt}`} />
                <StatCard title="Clientes Activos" value={String(stats.totalClients)} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Facturas Recientes</h3>
                {recentInvoices.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {recentInvoices.map(invoice => (
                             <li key={invoice.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-700">{clientMap.get(invoice.clientId) || 'Cliente Desconocido'}</p>
                                    <p className="text-sm text-gray-500">{invoice.serviceName}</p>
                                </div>
                                <div className="text-right">
                                     <p className="font-bold text-gray-800">${invoice.price.toFixed(2)}</p>
                                     <p className={`text-sm font-semibold ${invoice.status === 'Pagada' ? 'text-green-600' : invoice.status === 'Abonada' ? 'text-yellow-600' : 'text-red-600'}`}>{invoice.status}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 py-4">No hay facturas para mostrar.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardView;