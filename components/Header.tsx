
import React from 'react';
// FIX: Add .tsx extension to import path.
import { MenuIcon, LogoutIcon } from './icons.tsx';

interface HeaderProps {
    title: string;
    onMenuClick: () => void;
    userRole: 'admin' | 'specialist';
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick, userRole, onLogout }) => {
    return (
        <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-20 flex items-center h-16 px-4 border-b border-gray-200">
            {userRole === 'admin' && (
                 <button 
                    onClick={onMenuClick} 
                    className="p-2 -ml-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label="Abrir menú de navegación"
                >
                    <MenuIcon className="w-6 h-6" />
                </button>
            )}
            <h1 className={`${userRole === 'specialist' ? '' : 'ml-4'} text-xl font-bold text-gray-800 truncate`}>{title}</h1>
            <button
                onClick={onLogout}
                className="ml-auto p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Cerrar sesión"
            >
                <LogoutIcon className="w-6 h-6" />
            </button>
        </header>
    );
};

export default Header;