

import React, { useState } from 'react';
// FIX: Add .ts extension to import path.
import { Expense } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, EditIcon, TrashIcon } from './icons.tsx';

interface ExpenseListItemProps {
    expense: Expense;
    onEdit: () => void;
    onDelete: () => void;
}
const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ expense, onEdit, onDelete }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-lg text-gray-800">{expense.description}</p>
                <p className="text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </p>
                 <span className={`text-xs font-semibold px-2 py-1 rounded-full ${expense.type === 'Fijo' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {expense.type}
                </span>
            </div>
            <p className="font-extrabold text-lg text-red-600">-${expense.amount.toFixed(2)}</p>
        </div>
         <div className="flex justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
            <button onClick={onEdit} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors">
                <EditIcon className="w-5 h-5"/>
            </button>
            <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors">
                <TrashIcon className="w-5 h-5"/>
            </button>
        </div>
    </div>
);


interface ExpenseFormProps {
    onClose: () => void;
    onSubmit: (expenseData: Omit<Expense, 'id'> | Expense) => Promise<void>;
    initialData?: Expense | null;
}
const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose, onSubmit, initialData }) => {
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            description: formData.get('description') as string,
            amount: parseFloat(formData.get('amount') as string),
            type: formData.get('type') as 'Fijo' | 'Variable',
            date: formData.get('date') as string,
        };
        
        if (initialData) {
            await onSubmit({ ...initialData, ...data });
        } else {
            await onSubmit(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Descripción del Gasto</label>
                <input type="text" name="description" defaultValue={initialData?.description} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Monto</label>
                    <input type="number" name="amount" step="0.01" defaultValue={initialData?.amount} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Tipo de Gasto</label>
                    <select name="type" defaultValue={initialData?.type} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="Fijo">Fijo</option>
                        <option value="Variable">Variable</option>
                    </select>
                </div>
            </div>
             <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Fecha del Gasto</label>
                <input type="date" name="date" defaultValue={initialData?.date || new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" style={{colorScheme: 'dark'}} required />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    );
};


interface ExpensesViewProps {
    expenses: Expense[];
    onAddExpense: (expenseData: Omit<Expense, 'id'>) => Promise<void>;
    onUpdateExpense: (expense: Expense) => Promise<void>;
    onDeleteExpense: (expenseId: string) => Promise<void>;
}

const ExpensesView: React.FC<ExpensesViewProps> = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    const handleOpenModalForAdd = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleDeleteRequest = (expenseId: string) => {
        setDeletingExpenseId(expenseId);
    };

    const confirmDelete = async () => {
        if (deletingExpenseId) {
            await onDeleteExpense(deletingExpenseId);
            setDeletingExpenseId(null);
        }
    };

    const handleFormSubmit = async (data: Omit<Expense, 'id'> | Expense) => {
        if ('id' in data) {
            await onUpdateExpense(data);
        } else {
            await onAddExpense(data);
        }
        closeModal();
    };
    
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenModalForAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Agregar</span>
                </button>
            </div>

            {sortedExpenses.length > 0 ? (
                <div className="space-y-3">
                    {sortedExpenses.map(expense => 
                        <ExpenseListItem 
                            key={expense.id} 
                            expense={expense} 
                            onEdit={() => handleOpenModalForEdit(expense)}
                            onDelete={() => handleDeleteRequest(expense.id)}
                        />)
                    }
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay gastos registrados.</p>
                    <p className="text-gray-500">Presiona 'Agregar' para crear el primero.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingExpense ? "Editar Gasto" : "Agregar Nuevo Gasto"}>
                <ExpenseForm 
                    onClose={closeModal} 
                    onSubmit={handleFormSubmit} 
                    initialData={editingExpense} 
                />
            </Modal>
            
            <ConfirmationModal
                isOpen={!!deletingExpenseId}
                onClose={() => setDeletingExpenseId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar este gasto? Esta acción no se puede deshacer."
            />
        </div>
    );
};

export default ExpensesView;