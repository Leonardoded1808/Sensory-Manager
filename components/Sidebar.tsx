import React from 'react';
// FIX: Add .ts and .tsx extensions to import paths.
import { Page } from '../types.ts';
import { 
    DashboardIcon, 
    ClientsIcon, 
    ServicesIcon, 
    ReportsIcon, 
    DebtIcon, 
    ExpensesIcon, 
    MedicalHistoryIcon,
    InvoicingIcon,
    SpecialistIcon,
    ManagerIcon,
    ManagementIcon,
    CalendarIcon
} from './icons.tsx';

interface SidebarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
    isOpen: boolean;
    onClose: () => void;
}

interface NavItemProps {
    page: Page;
    label: string;
    icon: React.ReactNode;
    activePage: Page;
    onClick: (page: Page) => void;
    colorClass: string;
    bgClass: string;
}

const NavItem: React.FC<NavItemProps> = ({ page, label, icon, activePage, onClick, colorClass, bgClass }) => {
    const isActive = activePage === page;
    const itemClasses = `
        flex items-center w-full p-3 rounded-xl transition-all duration-200
        ${isActive ? 'bg-gray-50 shadow-sm border border-gray-100' : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'}
    `;

    return (
        <li>
            <a href="#" onClick={(e) => { e.preventDefault(); onClick(page); }} className={itemClasses}>
                <div className={`p-2 rounded-lg ${isActive ? bgClass + ' ' + colorClass : 'bg-gray-100 text-gray-500 group-hover:' + bgClass + ' group-hover:' + colorClass} transition-colors`}>
                    {icon}
                </div>
                <span className={`ml-3 font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{label}</span>
            </a>
        </li>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
    return (
        <>
            <div
                className={`fixed inset-0 z-30 bg-black transition-opacity duration-300 md:hidden ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <aside
                className={`fixed top-0 left-0 z-40 w-72 h-screen bg-white border-r border-gray-100 shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <div className="h-full px-4 py-6 overflow-y-auto flex flex-col">
                    <div className="flex items-center gap-3 px-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <DashboardIcon className="w-6 h-6 text-white"/>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Sensory Manager</h2>
                    </div>
                    
                    <div className="flex-1 space-y-1">
                         <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Principal</div>
                         <NavItem page="dashboard" label="Dashboard" icon={<DashboardIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-blue-600" bgClass="bg-blue-100" />
                         <NavItem page="calendar" label="Calendario" icon={<CalendarIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-purple-600" bgClass="bg-purple-100" />
                         
                         <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Gestión Operativa</div>
                         <NavItem page="clients" label="Clientes" icon={<ClientsIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
                         <NavItem page="invoicing" label="Facturación" icon={<InvoicingIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-amber-600" bgClass="bg-amber-100" />
                         <NavItem page="medicalHistory" label="Historial Médico" icon={<MedicalHistoryIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-rose-600" bgClass="bg-rose-100" />
                         
                         <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Equipo</div>
                         <NavItem page="specialists" label="Especialistas" icon={<SpecialistIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-indigo-600" bgClass="bg-indigo-100" />
                         <NavItem page="managers" label="Gerentes" icon={<ManagerIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-cyan-600" bgClass="bg-cyan-100" />
                         <NavItem page="services" label="Servicios" icon={<ServicesIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-fuchsia-600" bgClass="bg-fuchsia-100" />
                         
                         <div className="px-3 mt-6 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Finanzas & Admin</div>
                         <NavItem page="expenses" label="Gastos" icon={<ExpensesIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-orange-600" bgClass="bg-orange-100" />
                         <NavItem page="debt" label="Deudas" icon={<DebtIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-red-600" bgClass="bg-red-100" />
                         <NavItem page="reports" label="Reportes" icon={<ReportsIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-teal-600" bgClass="bg-teal-100" />
                         <NavItem page="management" label="Configuración" icon={<ManagementIcon className="w-5 h-5"/>} activePage={activePage} onClick={onNavigate} colorClass="text-slate-600" bgClass="bg-slate-200" />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;