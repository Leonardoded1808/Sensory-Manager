

import React, { useState, useMemo } from 'react';
import { Client, Invoice, Specialist, Service, Expense } from '../types.ts';
import { calculateAllDebts } from '../services/debtService.ts';

interface ReportsViewProps {
    clients: Client[];
    invoices: Invoice[];
    specialists: Specialist[];
    services: Service[];
    expenses: Expense[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ clients, invoices, specialists, services, expenses }) => {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredData = useMemo(() => {
        let filteredInvoices = invoices;
        let filteredExpenses = expenses;

        if (startDate || endDate) {
            const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
            const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

            filteredInvoices = invoices.filter(inv => {
                const invDate = new Date(inv.createdAt);
                if (start && invDate < start) return false;
                if (end && invDate > end) return false;
                return true;
            });

            filteredExpenses = expenses.filter(exp => {
                const expDate = new Date(`${exp.date}T00:00:00.000Z`);
                if (start && expDate < start) return false;
                if (end && expDate > end) return false;
                return true;
            });
        }
        
        // Calculate basic metrics
        const totalBilled = filteredInvoices.reduce((sum, inv) => sum + inv.price, 0);
        const totalCollected = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
        const totalDebtsGenerated = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Unique patients
        const uniquePatientIds = new Set(filteredInvoices.map(inv => inv.clientId));
        const patientsAttended = uniquePatientIds.size;

        // Service usage breakdown
        const serviceMap: Record<string, { count: number; total: number; collected: number }> = {};
        filteredInvoices.forEach(inv => {
            const name = inv.serviceName || 'Otros';
            if (!serviceMap[name]) serviceMap[name] = { count: 0, total: 0, collected: 0 };
            serviceMap[name].count += 1;
            serviceMap[name].total += inv.price;
            serviceMap[name].collected += inv.amountPaid;
        });
        const serviceStats = Object.keys(serviceMap).map(name => ({
            name,
            ...serviceMap[name]
        })).sort((a, b) => b.collected - a.collected);

        // Specialist breakdown
        const specialistMap: Record<string, { count: number; total: number }> = {};
        
        filteredInvoices.forEach(inv => {
            const specId = inv.specialistId;
            if (!specId) return;
            const spec = specialists.find(s => s.id === specId);
            const specName = spec ? spec.name : 'Desconocido';
            
            if (!specialistMap[specName]) specialistMap[specName] = { count: 0, total: 0 };
            specialistMap[specName].count += 1;
            specialistMap[specName].total += inv.price;
        });
        const specialistStats = Object.keys(specialistMap).map(name => ({
            name,
            ...specialistMap[name]
        })).sort((a, b) => b.total - a.total);

        // Total Debts global
        const allDebts = calculateAllDebts(clients, invoices); 
        const outstandingCurrentDebt = allDebts.reduce((sum, d) => sum + d.totalDebt, 0);

        return { 
            filteredInvoices, 
            filteredExpenses,
            totalBilled,
            totalCollected,
            totalDebtsGenerated,
            totalExpenses,
            patientsAttended,
            serviceStats,
            specialistStats,
            outstandingCurrentDebt,
            netProfit: totalCollected - totalExpenses
        };
    }, [startDate, endDate, invoices, expenses, clients, specialists, services]);


    return (
        <div className="p-5 animate-fadeIn min-h-screen">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end justify-between mb-6">
                <div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-1">Reporte Financiero y Clínico</h3>
                    <p className="text-sm text-gray-500">Seleccione un rango de fechas para generar el análisis.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="flex flex-col">
                        <label htmlFor="start-date" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Desde</label>
                        <input 
                            type="date" 
                            id="start-date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:blue-500 focus:outline-none w-full md:w-40 text-sm"
                            max={endDate || undefined}
                        />
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="end-date" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Hasta</label>
                        <input 
                            type="date" 
                            id="end-date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="p-2 border border-gray-200 rounded-lg focus:ring-2 focus:blue-500 focus:outline-none w-full md:w-40 text-sm"
                            min={startDate || undefined}
                        />
                    </div>
                    <button 
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="bg-gray-100 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors shrink-0 h-10 mt-auto text-sm"
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ganancias (Recaudado)</p>
                    <p className="text-3xl font-extrabold text-green-600 mt-1">${filteredData.totalCollected.toFixed(2)}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 flex justify-between">
                        <span>Facturado: ${filteredData.totalBilled.toFixed(2)}</span>
                    </p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Balance Neto del Período</p>
                    <p className={`text-3xl font-extrabold mt-1 ${filteredData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ${filteredData.netProfit.toFixed(2)}
                    </p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 flex justify-between">
                        <span>Ingresos vs Gastos</span>
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gastos Operativos</p>
                    <p className="text-3xl font-extrabold text-orange-600 mt-1">${filteredData.totalExpenses.toFixed(2)}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 flex justify-between">
                        <span>{filteredData.filteredExpenses.length} registros de gasto</span>
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pacientes Atendidos</p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-1">{filteredData.patientsAttended}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-1 flex justify-between">
                        <span>Pacientes únicos en rango</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-4 border-b pb-2">Rendimiento por Servicios</h4>
                    {filteredData.serviceStats.length > 0 ? (
                        <div className="space-y-4">
                            {filteredData.serviceStats.map(stat => (
                                <div key={stat.name} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-bold text-gray-800">{stat.name}</p>
                                        <p className="text-xs text-gray-500">{stat.count} contratos emitidos</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-extrabold text-green-700">${stat.collected.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">Facturado: ${stat.total.toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay datos de servicios en este período.</p>
                    )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-4 border-b pb-2">Productividad por Especialista</h4>
                    {filteredData.specialistStats.length > 0 ? (
                        <div className="space-y-4">
                            {filteredData.specialistStats.map(stat => (
                                <div key={stat.name} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-bold text-gray-800">{stat.name}</p>
                                        <p className="text-xs text-gray-500">{stat.count} servicios completados</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-extrabold text-gray-900">${stat.total.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">Valor facturado</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No hay datos de especialistas en este período.</p>
                    )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-4 border-b pb-2">Resumen de Deudas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Deuda Generada en Período</p>
                            <p className="text-2xl font-extrabold text-red-600">${filteredData.totalDebtsGenerated.toFixed(2)}</p>
                            <p className="text-xs text-red-500 mt-1">Saldo pendiente de las facturas emitidas en este rango.</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Deuda Histórica Global</p>
                            <p className="text-2xl font-extrabold text-gray-800">${filteredData.outstandingCurrentDebt.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">Suma total de deudas pendientes en todo el sistema.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;