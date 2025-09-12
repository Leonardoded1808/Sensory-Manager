
import React, { useState } from 'react';
// FIX: Add .ts extension to import path.
import { Specialist, User } from '../types.ts';

interface LoginViewProps {
    specialists: Specialist[];
    onLogin: (user: User, password?: string) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ specialists, onLogin }) => {
    const [adminPassword, setAdminPassword] = useState('');
    const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>(specialists[0]?.id || '');

    const handleAdminLogin = () => {
        onLogin({ role: 'admin' }, adminPassword);
    };

    const handleSpecialistLogin = () => {
        const specialist = specialists.find(s => s.id === selectedSpecialistId);
        if (specialist) {
            onLogin({ role: 'specialist', id: specialist.id, name: specialist.name });
        } else {
            alert('Por favor, seleccione un especialista válido.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="w-full max-w-md mx-auto">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Sensory Manager</h1>
                <p className="text-center text-gray-500 mb-8">Seleccione su rol para continuar</p>
                
                <div className="space-y-6">
                    {/* Admin Login */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Acceso de Administrador</h2>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="admin-password">Contraseña</label>
                            <input 
                                id="admin-password"
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ingrese la contraseña"
                            />
                        </div>
                        <button
                            onClick={handleAdminLogin}
                            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Entrar como Administrador
                        </button>
                    </div>

                    {/* Specialist Login */}
                    {specialists.length > 0 && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-700 mb-4">Acceso de Especialista</h2>
                            <p className="text-gray-600 mb-5">Acceso limitado para gestionar historial médico de pacientes y ver sus finanzas.</p>
                            <div className="space-y-4">
                                <select
                                    value={selectedSpecialistId}
                                    onChange={(e) => setSelectedSpecialistId(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {specialists.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleSpecialistLogin}
                                    className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                                    disabled={!selectedSpecialistId}
                                >
                                    Entrar como Especialista
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginView;