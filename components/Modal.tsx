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
            className={`fixed inset-0 bg-black flex justify-center items-end transition-opacity duration-300 ${isVisible ? 'bg-opacity-60' : 'bg-opacity-0'}`}
            onClick={handleClose}
        >
            <div
                className={`bg-slate-800 text-white w-full max-w-lg rounded-t-2xl p-6 shadow-xl transform transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-gray-100 mb-4">{title}</h3>
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
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center transition-opacity duration-300 z-50"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 text-white w-full max-w-md rounded-2xl p-6 shadow-xl transform transition-transform scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold text-gray-100 mb-4">{title}</h3>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-600 text-gray-200 font-bold rounded-lg hover:bg-gray-500">
                        {cancelText}
                    </button>
                    <button type="button" onClick={onConfirm} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};