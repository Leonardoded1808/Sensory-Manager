

import React from 'react';
// FIX: Add .ts and .tsx extensions to import paths.
import { Page } from '../types.ts';
import { DashboardIcon, ClientsIcon, ServicesIcon, ReportsIcon, DebtIcon, ExpensesIcon, MedicalHistoryIcon } from './icons.tsx';

interface NavButtonProps {
    page: Page;
    label: string;
    icon: React.ReactNode;
    activePage: Page;
    onClick: (page: Page) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ page, label, icon, activePage, onClick }) => {
    const isActive = activePage === page;
    const buttonClasses = `
        p-2 rounded-xl flex flex-col items-center justify-center transition-colors text-center
        ${isActive ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:bg-blue-50'}
    `;

    return (
        <button data-page={page} className={buttonClasses} onClick={() => onClick(page)}>
            {icon}
            <span className="text-xs font-bold leading-tight">{label}</span>
        </button>
    );
};

interface NavigationBarProps {
    activePage: Page;
    onNavigate: (page: Page) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ activePage, onNavigate }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 grid grid-cols-7 gap-1 p-2 shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]">
            <NavButton
                page="dashboard"
                label="Dashboard"
                icon={<DashboardIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
            <NavButton
                page="clients"
                label="Clientes"
                icon={<ClientsIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
            <NavButton
                page="services"
                label="Servicios"
                icon={<ServicesIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
             <NavButton
                page="expenses"
                label="Gastos"
                icon={<ExpensesIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
            <NavButton
                page="debt"
                label="Deudas"
                icon={<DebtIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
            <NavButton
                page="medicalHistory"
                label="Historial"
                icon={<MedicalHistoryIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
             <NavButton
                page="reports"
                label="Reportes"
                icon={<ReportsIcon className="w-7 h-7 mb-1" />}
                activePage={activePage}
                onClick={onNavigate}
            />
        </nav>
    );
};

export default NavigationBar;