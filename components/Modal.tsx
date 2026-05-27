import React, { useEffect, useState } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to finish
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-slate-950 flex justify-center items-end md:items-center transition-opacity duration-300 z-50 ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0'}`}
            onClick={handleClose}
        >
            <div
                className={`bg-white text-gray-900 w-full max-w-lg rounded-t-2xl md:rounded-2xl p-6 shadow-2xl transform transition-transform duration-300 border border-gray-100 max-h-[90vh] overflow-y-auto ${isVisible ? 'translate-y-0 scale-100' : 'translate-y-full md:translate-y-0 md:scale-95'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <button 
                        onClick={handleClose} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label="Cerrar"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;


interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-950 bg-opacity-50 flex justify-center items-center transition-opacity duration-300 z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white text-gray-900 w-full max-w-md rounded-2xl p-6 shadow-2xl transform transition-transform scale-100 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-gray-950 border-b border-gray-100 pb-3 mb-3">{title}</h3>
                <p className="text-gray-600 mb-6 text-sm">{message}</p>
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors text-sm">
                        {cancelText}
                    </button>
                    <button type="button" onClick={onConfirm} className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};