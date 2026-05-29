import React, { useMemo, useState } from 'react';
import { Client, Invoice, Expense, Service, Appointment } from '../types.ts';
import { calculateAllDebts } from '../services/debtService.ts'; // ADDED

interface DashboardViewProps {
    clients: Client[];
    invoices: Invoice[];
    expenses: Expense[];
    services: Service[];
    appointments: Appointment[];
    onNavigateToClient?: (clientId: string) => void; // ADDED
}

const StatCard: React.FC<{ 
    title: string; 
    value: string; 
    subvalue?: string; 
    subtext?: string; 
    colorClass?: string;
    icon?: React.ReactNode;
}> = ({ title, value, subvalue, subtext, colorClass = "text-gray-900", icon }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between min-h-[120px] transition-transform duration-250 hover:-translate-y-0.5 hover:shadow-md">
        <div className="space-y-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            <p className={`text-2xl md:text-3xl font-extrabold ${colorClass}`}>{value}</p>
            {subvalue && <p className="text-sm font-semibold text-gray-700">{subvalue}</p>}
            {subtext && <p className="text-xs font-medium text-gray-500">{subtext}</p>}
        </div>
        {icon && <div className="p-2 opacity-80">{icon}</div>}
    </div>
);


const DashboardView: React.FC<DashboardViewProps> = ({ clients, invoices, expenses, services, appointments, onNavigateToClient }) => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const d = new Date(inv.createdAt);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
    }, [invoices, selectedMonth, selectedYear]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const d = new Date(exp.date);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
    }, [expenses, selectedMonth, selectedYear]);
    
    const stats = useMemo(() => {
        // Precise financial rounding
        const totalIncome = Number(filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0).toFixed(2));
        const totalExpenses = Number(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2));
        const totalDebt = Number(filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0).toFixed(2));

        // Active Patients: registered patients that have an appointment or invoice in the selected month
        const activeClientsCount = clients.filter(c => {
            const hasRecentInvoice = filteredInvoices.some(i => i.clientId === c.id);
            const hasRecentAppt = appointments.some(a => {
                 const d = new Date(a.start);
                 return a.clientId === c.id && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
            });
            const hasPendingBalance = invoices.some(i => i.clientId === c.id && i.balance > 0); // Total historical debts still make a client active
            return hasRecentInvoice || hasRecentAppt || hasPendingBalance;
        }).length;

        // Contracted services counts: total service receipts issued this month, and active ones with pending balances
        const totalContractedServices = filteredInvoices.length;
        const activeContractsCount = filteredInvoices.filter(i => i.status !== 'Pagada').length;

        return {
            totalClients: clients.length,
            activeClientsCount,
            totalIncome: totalIncome.toFixed(2),
            totalDebt: totalDebt.toFixed(2),
            netBalance: (totalIncome - totalExpenses).toFixed(2),
            totalContractedServices,
            activeContractsCount
        };
    }, [clients, invoices, filteredInvoices, filteredExpenses, appointments, selectedMonth, selectedYear]);

    // Compute profitability per service
    const profitableServices = useMemo(() => {
        const serviceMap: { [name: string]: { count: number; billed: number; collected: number; balance: number } } = {};
        
        filteredInvoices.forEach(inv => {
            const name = inv.serviceName || 'Otros / Sin Especificar';
            if (!serviceMap[name]) {
                serviceMap[name] = { count: 0, billed: 0, collected: 0, balance: 0 };
            }
            serviceMap[name].count += 1;
            serviceMap[name].billed += inv.price;
            serviceMap[name].collected += inv.amountPaid;
            serviceMap[name].balance += inv.balance;
        });

        return Object.entries(serviceMap)
            .map(([name, data]) => ({
                name,
                count: data.count,
                billed: Number(data.billed.toFixed(2)),
                collected: Number(data.collected.toFixed(2)),
                balance: Number(data.balance.toFixed(2))
            }))
            // Sort by collected revenue (actual cash liquidity is the ultimate profitability marker)
            .sort((a, b) => b.collected - a.collected);
    }, [filteredInvoices]);

    const recentInvoices = useMemo(() => {
        return [...filteredInvoices]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [filteredInvoices]);
    
    // Calcula deudas pendientes por cliente
    const pendingDebts = useMemo(() => {
        const debts = calculateAllDebts(clients, filteredInvoices);
        return debts.filter(d => d.totalDebt > 0).sort((a, b) => b.totalDebt - a.totalDebt);
    }, [clients, filteredInvoices]);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c.patientName])), [clients]);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="p-5 animate-fadeIn space-y-6 bg-gray-50 min-h-screen">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-4">
                <h2 className="text-xl font-bold text-gray-800">Panel General</h2>
                <div className="flex items-center space-x-2">
                    <select 
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                    >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 transition-colors"
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* Upper Telemetry Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard 
                    title="Ingresos Recaudados" 
                    value={`$${stats.totalIncome}`} 
                    subtext="Efectivo real cobrado"
                    colorClass="text-green-600"
                    icon={
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatCard 
                    title="Balance Neto del Centro" 
                    value={`$${stats.netBalance}`} 
                    subtext="Ingresos - Gastos operativos"
                    colorClass={Number(stats.netBalance) >= 0 ? "text-blue-600" : "text-red-600"}
                    icon={
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
                <StatCard 
                    title="Fichero de Pacientes" 
                    value={String(stats.totalClients)} 
                    subvalue={`${stats.activeClientsCount} Activos`}
                    subtext="Sesiones en últimos 30 días o saldos"
                    colorClass="text-gray-900"
                    icon={
                        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                />
                <StatCard 
                    title="Servicios Contratados" 
                    value={String(stats.totalContractedServices)} 
                    subvalue={`${stats.activeContractsCount} Pendientes`}
                    subtext="Recibos emitidos con cargo"
                    colorClass="text-orange-600"
                    icon={
                        <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                />
            </div>

            {/* Middle Main Grid: Profitability Analysis & Recent Receipts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profitability Panel */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-extrabold text-gray-900">Análisis de Rentabilidad de Servicios</h3>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Orden: Recaudado</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">Muestra qué servicios generan mayor volumen de efectivo real y cuántas veces han sido contratados por el centro médico.</p>
                        
                        {profitableServices.length > 0 ? (
                            <div className="space-y-4">
                                {profitableServices.map((service, idx) => {
                                    // Calculate relative bar width against the highest collected service
                                    const maxCollected = profitableServices[0]?.collected || 1;
                                    const percentageWidth = Math.max(10, Math.min(100, (service.collected / maxCollected) * 100));
                                    
                                    return (
                                        <div key={idx} className="space-y-1.5 pb-3 border-b border-gray-50 last:border-none">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">{idx + 1}</span>
                                                    <span className="font-bold text-gray-800">{service.name}</span>
                                                    <span className="text-xs text-gray-400">({service.count} {service.count === 1 ? 'contrato' : 'contratos'})</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-extrabold text-gray-900">${service.collected.toFixed(2)}</p>
                                                    <p className="text-xxs text-gray-400">Facturado: ${service.billed.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                                                    style={{ width: `${percentageWidth}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500 font-semibold">No hay servicios contratados aún.</p>
                                <p className="text-xs text-gray-450">Cree un recibo en la sección de Facturación.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Invoices Panel */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 mb-4">Últimas Facturas / Recibos Emitidos</h3>
                        {recentInvoices.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {recentInvoices.map(invoice => (
                                     <li key={invoice.id} className="py-3.5 flex justify-between items-center transition-all hover:bg-gray-50/50 px-2 rounded-xl">
                                        <div>
                                            <p className="font-extrabold text-gray-850">
                                                {clientMap.get(invoice.clientId) || 'Cliente Desconocido'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">{invoice.serviceName}</p>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-bold text-gray-800">${invoice.price.toFixed(2)}</p>
                                             <span className={`inline-block text-xs font-bold px-2 py-0.5 mt-0.5 rounded-full ${
                                                 invoice.status === 'Pagada' 
                                                     ? 'bg-green-100 text-green-800' 
                                                     : invoice.status === 'Abonada' 
                                                         ? 'bg-yellow-105 text-yellow-800 bg-yellow-100' 
                                                         : 'bg-red-100 text-red-800'
                                             }`}>
                                                 {invoice.status}
                                             </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-550 py-10">No hay facturas registradas en el sistema.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Pending Payments Widget */}
            <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm mt-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-900 flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                            <span>Pacientes Pendientes de Pago</span>
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Haga clic en un paciente para ver sus detalles y registrar pagos.</p>
                    </div>
                    <div>
                        <span className="px-4 py-2 bg-red-50 text-red-700 font-bold rounded-lg">${stats.totalDebt} en Deuda Total</span>
                    </div>
                </div>

                {pendingDebts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingDebts.map(debt => (
                            <div 
                                key={debt.client.id} 
                                onClick={() => onNavigateToClient && onNavigateToClient(debt.client.id)}
                                className="p-4 rounded-xl border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer flex justify-between items-center group"
                            >
                                <div>
                                    <p className="font-bold text-gray-900 group-hover:text-red-900">{debt.client.patientName}</p>
                                    <p className="text-xs text-gray-500">Rep: {debt.client.representativeName}</p>
                                </div>
                                <div className="text-right flex items-center space-x-3">
                                    <p className="font-extrabold text-red-600 text-lg">${debt.totalDebt.toFixed(2)}</p>
                                    <svg className="w-5 h-5 text-red-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-100">
                        <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-lg font-bold text-gray-800">No hay deudas pendientes</p>
                        <p className="text-sm text-gray-500">Todos los pacientes están al día con sus pagos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardView;