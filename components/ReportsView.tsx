

import React, { useState, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Invoice, Specialist, Service, Expense } from '../types.ts';
// FIX: Add .ts extension to import path.
import { generateBusinessSummary, generateSpecialistReport, generateDebtReport, generateExpenseReport } from '../services/geminiService.ts';
// FIX: Add .ts extension to import path.
import { calculateAllDebts } from '../services/debtService.ts';
// FIX: Add .tsx extension to import path.
import { DebtIcon, ExpensesIcon, GenerateIcon, SpecialistIcon, SparkleIcon } from './icons.tsx';

interface ReportsViewProps {
    clients: Client[];
    invoices: Invoice[];
    specialists: Specialist[];
    services: Service[];
    expenses: Expense[];
}

interface ReportOptionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onGenerate: () => void;
    isGenerating: boolean;
    disabled: boolean;
}

const ReportOptionCard: React.FC<ReportOptionCardProps> = ({ title, description, icon, onGenerate, isGenerating, disabled }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md flex flex-col justify-between transition-all ${disabled ? 'opacity-60' : 'hover:shadow-lg'}`}>
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-full">{icon}</div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-2 mb-6">{description}</p>
        </div>
        <button
            onClick={onGenerate}
            disabled={isGenerating || disabled}
            className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
            <SparkleIcon className="w-5 h-5"/>
            <span>{isGenerating ? 'Generando...' : 'Generar'}</span>
        </button>
    </div>
);

const ReportsView: React.FC<ReportsViewProps> = ({ clients, invoices, specialists, services, expenses }) => {
    const [report, setReport] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportTitle, setReportTitle] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const filteredData = useMemo(() => {
        if (!startDate && !endDate) {
            return { filteredInvoices: invoices, filteredExpenses: expenses };
        }

        const start = startDate ? new Date(`${startDate}T00:00:00.000Z`) : null;
        const end = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null;

        const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.createdAt);
            if (start && invDate < start) return false;
            if (end && invDate > end) return false;
            return true;
        });

        const filteredExpenses = expenses.filter(exp => {
            const expDate = new Date(`${exp.date}T00:00:00.000Z`); // Treat date as UTC
            if (start && expDate < start) return false;
            if (end && expDate > end) return false;
            return true;
        });

        return { filteredInvoices, filteredExpenses };
    }, [startDate, endDate, invoices, expenses]);


    const handleGenerate = async (reportType: 'business' | 'specialists' | 'debt' | 'expenses') => {
        setIsLoading(true);
        setError(null);
        setReport(null);
        setReportTitle('');

        const { filteredInvoices, filteredExpenses } = filteredData;
        
        let dateRangeTitle = '';
        if (startDate || endDate) {
            const startStr = startDate ? new Date(`${startDate}T00:00:00.000Z`).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'Inicio';
            const endStr = endDate ? new Date(`${endDate}T00:00:00.000Z`).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'Ahora';
            dateRangeTitle = ` (${startStr} - ${endStr})`;
        }

        try {
            let summary = '';
            let title = '';
            switch (reportType) {
                case 'business':
                    title = 'Resumen de Negocio' + dateRangeTitle;
                    summary = await generateBusinessSummary(clients, filteredInvoices);
                    break;
                case 'specialists':
                    title = 'Reporte de Especialistas' + dateRangeTitle;
                    summary = await generateSpecialistReport(specialists, filteredInvoices, services);
                    break;
                case 'debt':
                    title = 'Análisis de Deudas' + dateRangeTitle;
                    const debtData = calculateAllDebts(clients, filteredInvoices);
                    summary = await generateDebtReport(debtData);
                    break;
                case 'expenses':
                    title = 'Análisis de Gastos' + dateRangeTitle;
                    summary = await generateExpenseReport(filteredExpenses);
                    break;
            }
            setReport(summary);
            setReportTitle(title);
        } catch (err) {
            setError('Ocurrió un error al generar el reporte.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const reportOptions = [
        { 
            type: 'business' as const, 
            title: 'Resumen de Negocio', 
            description: 'Análisis general de clientes, facturación y popularidad de servicios.', 
            icon: <GenerateIcon className="w-6 h-6 text-blue-600"/>,
            disabled: clients.length === 0 || filteredData.filteredInvoices.length === 0 
        },
        { 
            type: 'specialists' as const, 
            title: 'Reporte de Especialistas', 
            description: 'Desglose de ganancias y servicios realizados por cada especialista.',
            icon: <SpecialistIcon className="w-6 h-6 text-blue-600"/>,
            disabled: specialists.length === 0 || filteredData.filteredInvoices.length === 0
        },
        { 
            type: 'debt' as const, 
            title: 'Análisis de Deudas', 
            description: 'Resumen de deudas pendientes y clientes con saldos por pagar.', 
            icon: <DebtIcon className="w-6 h-6 text-blue-600"/>,
            disabled: filteredData.filteredInvoices.length === 0
        },
        { 
            type: 'expenses' as const, 
            title: 'Análisis de Gastos', 
            description: 'Detalle de gastos fijos y variables para optimizar las finanzas.', 
            icon: <ExpensesIcon className="w-6 h-6 text-blue-600"/>,
            disabled: filteredData.filteredExpenses.length === 0
        },
    ];

    return (
        <div className="p-5 animate-fadeIn space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md space-y-4">
                <h3 className="text-lg font-bold text-gray-800">Filtrar por Rango de Fechas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input 
                            type="date" 
                            id="start-date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            style={{colorScheme: 'light'}}
                            max={endDate || undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input 
                            type="date" 
                            id="end-date"
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


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {reportOptions.map(opt => (
                     <ReportOptionCard 
                        key={opt.type}
                        title={opt.title}
                        description={opt.description}
                        icon={opt.icon}
                        isGenerating={isLoading}
                        disabled={opt.disabled}
                        onGenerate={() => handleGenerate(opt.type)}
                     />
                ))}
            </div>

            {isLoading && (
                <div className="text-center py-16 bg-white rounded-xl shadow-md">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-lg font-semibold text-gray-600">Generando reporte con IA...</p>
                    <p className="text-gray-500">Esto puede tomar un momento.</p>
                </div>
            )}

            {error && (
                <div className="text-center py-16 bg-red-50 p-4 rounded-xl shadow-md">
                     <p className="text-lg font-semibold text-red-700">{error}</p>
                </div>
            )}

            {report && (
                <div className="bg-white p-6 rounded-xl shadow-md mt-6 animate-fadeIn">
                     <h3 className="text-xl font-bold text-gray-800 mb-4">{reportTitle}</h3>
                     <pre className="text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{report}</pre>
                </div>
            )}
        </div>
    );
};

export default ReportsView;