import React, { useState, useEffect } from 'react';
import { CloudIcon, CheckCircleIcon } from './icons.tsx';

interface AutoBackupModalProps {
    isOpen: boolean;
    onBackup: () => Promise<void>;
    onDismiss: () => void;
}

const AutoBackupModal: React.FC<AutoBackupModalProps> = ({ isOpen, onBackup, onDismiss }) => {
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCompleted(false);
            setIsBackingUp(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            await onBackup();
            setCompleted(true);
            setTimeout(() => {
                onDismiss();
            }, 3000);
        } catch (error) {
            console.error("Backup failed", error);
            setIsBackingUp(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-70 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
                <div className="p-6 text-center space-y-4">
                    {completed ? (
                        <>
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 animate-scaleIn">
                                <CheckCircleIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900">¡Respaldo Exitoso!</h2>
                            <p className="text-gray-500 font-medium tracking-tight leading-relaxed text-sm">
                                Su base de datos ha sido protegida y respaldada correctamente en la ubicación seleccionada. El administrador ha confirmado la protección de hoy.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                                <CloudIcon className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900">Respaldo Diario Automático</h2>
                            <p className="text-gray-500 font-medium text-sm tracking-tight leading-relaxed">
                                Es hora de proteger su base de datos. Guarde una copia de seguridad en Google Drive, la Nube u otra ubicación externa para asegurar todos los registros del centro médico.
                            </p>

                            <div className="pt-4 flex flex-col space-y-3">
                                <button 
                                    onClick={handleBackup} 
                                    disabled={isBackingUp}
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-blue-300"
                                >
                                    {isBackingUp ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <span>Procesando respaldo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CloudIcon className="w-5 h-5"/>
                                            <span>Guardar en la Nube (Drive / Archivo)</span>
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={onDismiss} 
                                    disabled={isBackingUp}
                                    className="w-full bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Recordarme Mañana
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoBackupModal;
