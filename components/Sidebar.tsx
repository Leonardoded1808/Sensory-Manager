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
}

const NavItem: React.FC<NavItemProps> = ({ page, label, icon, activePage, onClick }) => {
    const isActive = activePage === page;
    const itemClasses = `
        flex items-center w-full p-3 rounded-lg transition-colors
        ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}
    `;

    return (
        <li>
            <a href="#" onClick={(e) => { e.preventDefault(); onClick(page); }} className={itemClasses}>
                {icon}
                <span className="ml-3 font-semibold">{label}</span>
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
                className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
            >
                <div className="h-full px-3 py-4 overflow-y-auto">
                    <h2 className="text-2xl font-bold text-gray-800 px-2 mb-6">Sensory Manager</h2>
                    <ul className="space-y-2">
                         <NavItem page="dashboard" label="Dashboard" icon={<DashboardIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="calendar" label="Calendario" icon={<CalendarIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="clients" label="Clientes" icon={<ClientsIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="invoicing" label="Facturación" icon={<InvoicingIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="medicalHistory" label="Historial Médico" icon={<MedicalHistoryIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <hr/>
                         {/* FIX: Corrected typo `active-page` to `activePage`. */}
                         <NavItem page="specialists" label="Especialistas" icon={<SpecialistIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="managers" label="Gerentes" icon={<ManagerIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="services" label="Servicios" icon={<ServicesIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <hr/>
                         <NavItem page="expenses" label="Gastos" icon={<ExpensesIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="debt" label="Deudas" icon={<DebtIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="reports" label="Reportes" icon={<ReportsIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                         <NavItem page="management" label="Gestión" icon={<ManagementIcon className="w-6 h-6"/>} activePage={activePage} onClick={onNavigate} />
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;