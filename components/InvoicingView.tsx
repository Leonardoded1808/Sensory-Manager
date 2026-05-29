import React, { useState, useEffect, useMemo } from 'react';
// FIX: Add .ts extension to import path.
import { Client, Service, Invoice, TicketConfig, Specialist, Payment, Manager } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
// FIX: Add .tsx extension to import path.
import { AddIcon, PdfIcon, EditIcon, TrashIcon, AddPaymentIcon } from './icons.tsx';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

const statusStyles = {
    'Pagada': 'bg-green-100 text-green-800',
    'Abonada': 'bg-yellow-100 text-yellow-800',
    'Pendiente': 'bg-red-100 text-red-800',
};

interface InvoiceListItemProps {
    invoice: Invoice;
    client?: Client;
    specialist?: Specialist;
    onGeneratePdf: (invoice: Invoice, client?: Client, specialist?: Specialist) => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddPayment: () => void;
}
const InvoiceListItem: React.FC<InvoiceListItemProps> = ({ invoice, client, specialist, onGeneratePdf, onEdit, onDelete, onAddPayment }) => (
    <div className="bg-white p-4 rounded-xl shadow-md">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-lg text-gray-800">{client?.patientName || 'Cliente no encontrado'}</p>
                <p className="text-sm text-gray-500">{invoice.serviceName}</p>
                {specialist && <p className="text-xs text-purple-600 font-medium mt-1">Especialista: {specialist.name}</p>}
                 <p className="text-xs text-gray-400 mt-1">
                    {new Date(invoice.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
            </div>
            <div className="text-right flex flex-col items-end">
                <p className="font-extrabold text-lg text-gray-800">${invoice.price.toFixed(2)}</p>
                 <span className={`text-xs font-semibold px-2 py-1 mt-1 rounded-full ${statusStyles[invoice.status]}`}>
                    {invoice.status}
                </span>
            </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">
            {invoice.payments && invoice.payments.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Historial de Abonos</h4>
                    <ul className="space-y-1.5">
                        {invoice.payments.map(payment => (
                            <li key={payment.id} className="flex justify-between items-center text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                                <span>
                                    {new Date(payment.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                </span>
                                <span className="font-semibold text-green-700">+${payment.amount.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="text-sm flex justify-between items-center">
                <div>
                    <p>Pagado: <span className="font-medium text-green-600">${invoice.amountPaid.toFixed(2)}</span></p>
                    <p>Saldo: <span className="font-medium text-red-600">${invoice.balance.toFixed(2)}</span></p>
                </div>
                <div className="flex items-center space-x-1">
                    {invoice.balance > 0 && (
                        <button
                            onClick={onAddPayment}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                            title="Registrar Abono"
                        >
                            <AddPaymentIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button 
                        onClick={onEdit} 
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Editar Recibo"
                    >
                        <EditIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={onDelete} 
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Eliminar Recibo"
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                    <button 
                        onClick={() => onGeneratePdf(invoice, client, specialist)} 
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Generar PDF"
                    >
                        <PdfIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    </div>
);


interface InvoiceFormProps {
    onClose: () => void;
    clients: Client[];
    services: Service[];
    specialists: Specialist[];
    managers: Manager[];
    onSubmit: (data: Omit<Invoice, 'id' | 'balance' | 'status' | 'createdAt' | 'payments'> | Invoice) => Promise<void>;
    initialData?: Invoice | null;
}
const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, clients, services, specialists, managers, onSubmit, initialData }) => {
    const isEditing = !!initialData;

    const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || (clients.length === 1 ? clients[0].id : ''));
    const [selectedServiceId, setSelectedServiceId] = useState(initialData?.serviceId || (services.length === 1 ? services[0].id : ''));
    const [amountPaid, setAmountPaid] = useState<string>(initialData ? String(initialData.amountPaid) : '');
    const [selectedSpecialistId, setSelectedSpecialistId] = useState(initialData?.specialistId || '');
    const [specialistEarnings, setSpecialistEarnings] = useState<string>(initialData ? String(initialData.specialistEarnings || '') : '');
    const [managerEarnings, setManagerEarnings] = useState<{ managerId: string; amount: string }[]>(
        initialData?.managerEarnings?.map(me => ({ ...me, amount: String(me.amount) })) || []
    );


    const selectedService = useMemo(() => services.find(s => s.id === selectedServiceId), [services, selectedServiceId]);
    
    const availableSpecialists = useMemo(() => {
        if (!selectedServiceId) return [];
        return specialists.filter(sp => sp.serviceIds.includes(selectedServiceId));
    }, [specialists, selectedServiceId]);

    const price = useMemo(() => isEditing ? initialData.price : (selectedService?.price || 0), [isEditing, initialData, selectedService]);
    
    useEffect(() => {
        if (!isEditing && clients.length === 1 && !selectedClientId) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients, selectedClientId, isEditing]);

    useEffect(() => {
        if (!isEditing && services.length === 1 && !selectedServiceId) {
            setSelectedServiceId(services[0].id);
        }
    }, [services, selectedServiceId, isEditing]);
    
    useEffect(() => {
        if (selectedSpecialistId && !availableSpecialists.some(sp => sp.id === selectedSpecialistId)) {
            setSelectedSpecialistId('');
            setSpecialistEarnings('');
        }
    }, [availableSpecialists, selectedSpecialistId]);

    const handleManagerEarningChange = (index: number, field: 'managerId' | 'amount', value: string) => {
        const updated = [...managerEarnings];
        updated[index] = { ...updated[index], [field]: value };
        setManagerEarnings(updated);
    };

    const addManagerEarning = () => {
        setManagerEarnings([...managerEarnings, { managerId: '', amount: '' }]);
    };

    const removeManagerEarning = (index: number) => {
        setManagerEarnings(managerEarnings.filter((_, i) => i !== index));
    };

    const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedServiceId(e.target.value);
        setSelectedSpecialistId('');
        setSpecialistEarnings('');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const finalManagerEarnings = managerEarnings
            .filter(me => me.managerId && parseFloat(me.amount) > 0)
            .map(me => ({ managerId: me.managerId, amount: parseFloat(me.amount) }));

        if (isEditing) {
            const updatedData: Invoice = {
                ...initialData,
                specialistId: selectedSpecialistId || undefined,
                specialistEarnings: specialistEarnings ? parseFloat(specialistEarnings) : undefined,
                managerEarnings: finalManagerEarnings,
            };
            await onSubmit(updatedData);
        } else {
             if (!selectedService || !selectedClientId) {
                alert('Cliente y servicio son obligatorios.');
                return;
            }
            const data: Omit<Invoice, 'id' | 'balance' | 'status' | 'createdAt' | 'payments'> = {
                clientId: selectedClientId,
                serviceId: selectedService.id,
                serviceName: selectedService.serviceName,
                price: selectedService.price,
                amountPaid: parseFloat(amountPaid) || 0,
                specialistId: selectedSpecialistId || undefined,
                specialistEarnings: specialistEarnings ? parseFloat(specialistEarnings) : undefined,
                managerEarnings: finalManagerEarnings,
            };
            await onSubmit(data);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Cliente</label>
                <select name="clientId" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" required disabled={isEditing}>
                     <option value="" disabled>-- Seleccione un cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.representativeName} (Paciente: {c.patientName})</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Servicio</label>
                <select name="serviceId" value={selectedServiceId} onChange={handleServiceChange} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" required disabled={isEditing}>
                    <option value="" disabled>-- Seleccione un servicio --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.serviceName} (${s.price})</option>)}
                </select>
            </div>
             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Especialista (Opcional)</label>
                <select name="specialistId" value={selectedSpecialistId} onChange={e => setSelectedSpecialistId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={availableSpecialists.length === 0}>
                    <option value="">-- {availableSpecialists.length === 0 ? 'Ninguno disponible para este servicio' : 'Seleccione un especialista'} --</option>
                    {availableSpecialists.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                </select>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ganancia Especialista</label>
                    <input type="number" name="specialistEarnings" value={specialistEarnings} onChange={e => setSpecialistEarnings(e.target.value)} disabled={!selectedSpecialistId} step="0.01" min="0" className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" placeholder={!selectedSpecialistId ? "N/A" : "0.00"}/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{isEditing ? 'Monto Pagado (No editable)' : 'Abono Inicial'}</label>
                    <input type="number" name="amountPaid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} step="0.01" min="0" max={price} className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400" placeholder="0.00" disabled={isEditing}/>
                    {isEditing && <p className="text-xs text-gray-500 mt-1">Use el botón 'Abonar' para agregar pagos.</p>}
                </div>
            </div>
            
            {/* Manager Earnings Section */}
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-sm font-bold text-gray-700">Ganancias de Gerentes (Opcional)</label>
                {managerEarnings.map((earning, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <select
                            value={earning.managerId}
                            onChange={(e) => handleManagerEarningChange(index, 'managerId', e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm"
                        >
                            <option value="">-- Seleccione Gerente --</option>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input
                            type="number"
                            value={earning.amount}
                            onChange={(e) => handleManagerEarningChange(index, 'amount', e.target.value)}
                            step="0.01" min="0" placeholder="Monto"
                            className="w-32 p-2 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm"
                        />
                        <button type="button" onClick={() => removeManagerEarning(index)} className="p-2 text-red-650 hover:text-red-800 transition-colors">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addManagerEarning} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    + Añadir Ganancia de Gerente
                </button>
            </div>

             <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Precio Total del Servicio</label>
                <input type="text" value={`$${(price || 0).toFixed(2)}`} className="w-full p-2.5 bg-gray-100 border border-gray-300 text-gray-850 font-extrabold rounded-lg text-lg" readOnly />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">{isEditing ? 'Guardar Cambios' : 'Crear Recibo'}</button>
            </div>
        </form>
    );
};


interface PaymentFormProps {
    onClose: () => void;
    onSubmit: (amount: number, date: string) => Promise<void>;
    maxAmount: number;
}
const PaymentForm: React.FC<PaymentFormProps> = ({ onClose, onSubmit, maxAmount }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const paymentAmount = parseFloat(amount);
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            setError('Por favor, ingrese un monto válido mayor a 0.');
            return;
        }
        if (Number(paymentAmount.toFixed(2)) > Number(maxAmount.toFixed(2))) {
            setError(`El monto no puede superar el saldo pendiente de $${maxAmount.toFixed(2)}.`);
            return;
        }
        setError(null);
        await onSubmit(paymentAmount, date);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-900">
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-sm font-semibold animate-pulse">
                    {error}
                </div>
            )}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Monto a Abonar (Saldo: ${maxAmount.toFixed(2)})</label>
                <input
                    type="number"
                    value={amount}
                    onChange={e => {
                        setAmount(e.target.value);
                        setError(null);
                    }}
                    step="0.01"
                    min="0.01"
                    max={maxAmount.toFixed(2)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base"
                    placeholder="0.00"
                    required
                    autoFocus
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Fecha del Abono</label>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base"
                    style={{colorScheme: 'light'}}
                    required
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-750 transition-colors">Registrar Abono</button>
            </div>
        </form>
    );
};


interface InvoicingViewProps {
    clients: Client[];
    services: Service[];
    invoices: Invoice[];
    specialists: Specialist[];
    managers: Manager[];
    ticketConfig: TicketConfig;
    onCreateInvoice: (data: Omit<Invoice, 'id' | 'balance' | 'status' | 'createdAt' | 'payments'>) => Promise<void>;
    onUpdateInvoice: (invoice: Invoice) => Promise<void>;
    onDeleteInvoice: (invoiceId: string) => Promise<void>;
    onAddPayment: (invoiceId: string, paymentData: Omit<Payment, 'id'>) => Promise<void>;
}

const InvoicingView: React.FC<InvoicingViewProps> = ({ clients, services, invoices, specialists, managers, ticketConfig, onCreateInvoice, onUpdateInvoice, onDeleteInvoice, onAddPayment }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
    const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

    const handleFormSubmit = async (data: Omit<Invoice, 'id' | 'balance' | 'status' | 'createdAt' | 'payments'> | Invoice) => {
        if ('id' in data) {
            await onUpdateInvoice(data);
        } else {
            await onCreateInvoice(data);
        }
        closeModal();
    };

    const handleOpenModalForAdd = () => {
        setEditingInvoice(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsModalOpen(true);
    };

     const handleOpenPaymentModal = (invoice: Invoice) => {
        setPayingInvoice(invoice);
    };

    const handlePaymentSubmit = async (amount: number, date: string) => {
        if (payingInvoice) {
            await onAddPayment(payingInvoice.id, { amount, date });
        }
        setPayingInvoice(null);
    };

    const handleDeleteRequest = (invoiceId: string) => {
        setDeletingInvoiceId(invoiceId);
    };

    const confirmDelete = async () => {
        if (deletingInvoiceId) {
            await onDeleteInvoice(deletingInvoiceId);
            setDeletingInvoiceId(null);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingInvoice(null);
    };


    const handleGeneratePdf = (invoice: Invoice, client?: Client, specialist?: Specialist) => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;
    
        // 1. Header
        const logoWidth = 25;
        if (ticketConfig.logo) {
            try {
                const img = new Image();
                img.src = ticketConfig.logo;
                const aspectRatio = img.width / img.height;
                const logoHeight = logoWidth / aspectRatio;
                doc.addImage(ticketConfig.logo, 'PNG', pageW - margin - logoWidth, y, logoWidth, logoHeight);
            } catch (e) {
                console.error("Error adding logo to PDF", e);
            }
        }
    
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const companyX = margin;
        if (ticketConfig.companyName) doc.text(ticketConfig.companyName, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.companyId) doc.text(`RIF: ${ticketConfig.companyId}`, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.address) doc.text(ticketConfig.address, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.phone) doc.text(`Tel: ${ticketConfig.phone}`, companyX, y, { align: 'left' });
        y += 5;
        if (ticketConfig.email) doc.text(ticketConfig.email, companyX, y, { align: 'left' });
    
        y = Math.max(y, margin + 30);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 10;
    
        // 2. Invoice and Client Info
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('RECIBO', margin, y);
    
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Recibo #: ${invoice.id.substring(0, 8)}`, companyX, y - 5, { align: 'right' });
        doc.text(`Fecha: ${new Date(invoice.createdAt).toLocaleDateString('es-ES')}`, companyX, y, { align: 'right' });
        y += 10;
    
        doc.setFont('helvetica', 'bold');
        doc.text('Recibo para:', margin, y);
        doc.setFont('helvetica', 'normal');
        if (client) {
            doc.text(client.representativeName, margin, y + 5);
            doc.text(`Paciente: ${client.patientName}`, margin, y + 10);
            if (client.representativeId) doc.text(`ID: ${client.representativeId}`, margin, y + 15);
             if (specialist) {
                doc.setFont('helvetica', 'bold');
                doc.text('Atendido por:', margin, y + 20);
                doc.setFont('helvetica', 'normal');
                doc.text(specialist.name, margin + 25, y + 20);
            }
        } else {
            doc.text('Cliente no encontrado', margin, y + 5);
        }
        y += 25;
    
        // 3. Table
        const pageContentWidth = pageW - (margin * 2);
        const priceColWidth = pageContentWidth * 0.22;
        const totalColWidth = pageContentWidth * 0.22;
        const descColWidth = pageContentWidth - priceColWidth - totalColWidth;
        
        const descColX = margin;
        const priceColX = descColX + descColWidth;
        const totalColX = priceColX + priceColWidth;

        const textPadding = 3;
        const rowHeight = 9;
        
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, y, pageContentWidth, rowHeight, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        doc.text('Descripción', descColX + textPadding, y + 6);
        doc.text('Precio', priceColX + priceColWidth - textPadding, y + 6, { align: 'right' });
        doc.text('Total', totalColX + totalColWidth - textPadding, y + 6, { align: 'right' });
        y += rowHeight;

        doc.setFont('helvetica', 'normal');
        const serviceNameLines = doc.splitTextToSize(invoice.serviceName, descColWidth - (textPadding * 2));
        const bodyHeight = Math.max(rowHeight, (serviceNameLines.length * 5) + 6);
        
        doc.setDrawColor(200, 200, 200);
        doc.rect(descColX, y, descColWidth, bodyHeight, 'S');
        doc.rect(priceColX, y, priceColWidth, bodyHeight, 'S');
        doc.rect(totalColX, y, totalColWidth, bodyHeight, 'S');
        
        const verticalCenter = y + (bodyHeight / 2) + 2;
        doc.text(serviceNameLines, descColX + textPadding, y + 6);
        doc.text(`$${invoice.price.toFixed(2)}`, priceColX + priceColWidth - textPadding, verticalCenter, { align: 'right' });
        doc.text(`$${invoice.price.toFixed(2)}`, totalColX + totalColWidth - textPadding, verticalCenter, { align: 'right' });
        y += bodyHeight;

        const labelX = totalColX - textPadding;
        const valueX = totalColX + totalColWidth - textPadding;
        
        // 4. Payment History
        if (invoice.payments && invoice.payments.length > 0) {
            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Historial de Pagos:', margin, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            invoice.payments.forEach(p => {
                const paymentDate = new Date(p.date).toLocaleDateString('es-ES', { timeZone: 'UTC' });
                doc.text(`- Abono del ${paymentDate}:`, margin + 5, y);
                doc.text(`$${p.amount.toFixed(2)}`, valueX, y, { align: 'right' });
                y += 5;
            });
        }
        
        // 5. Totals
        y += 5;

        const drawTotalRow = (label: string, value: string, options: {isBold?: boolean, isRed?: boolean} = {}) => {
            const { isBold = false, isRed = false } = options;
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.setTextColor(isRed ? 200 : 0, 0, 0);
            doc.text(label, labelX, y, { align: 'right' });
            doc.text(value, valueX, y, { align: 'right' });
            y += 7;
        };

        doc.setFontSize(11);
        drawTotalRow('Total:', `$${invoice.price.toFixed(2)}`);
        drawTotalRow('Total Abonado:', `$${invoice.amountPaid.toFixed(2)}`);
        
        doc.setLineWidth(0.3);
        doc.setDrawColor(180,180,180);
        doc.line(priceColX, y - 4, totalColX + totalColWidth, y - 4);

        drawTotalRow('Saldo Pendiente:', `$${invoice.balance.toFixed(2)}`, { isBold: true, isRed: true });

        y += 13;

        // 6. Additional Info & Footer
        const pageH = doc.internal.pageSize.getHeight();
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(9);

        if (ticketConfig.additionalInfo) {
            doc.text(ticketConfig.additionalInfo, margin, y, { maxWidth: pageContentWidth });
        }
        
        if (ticketConfig.footer) {
            doc.text(ticketConfig.footer, pageW / 2, pageH - 10, { align: 'center' });
        }
    
        doc.save(`Recibo-${client?.patientName || 'Cliente'}-${invoice.id.substring(0, 5)}.pdf`);
    };
    
    const sortedInvoices = [...invoices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const clientsMap = new Map(clients.map(c => [c.id, c]));
    const specialistsMap = new Map(specialists.map(s => [s.id, s]));

    return (
        <div className="p-5 animate-fadeIn">
             <div className="flex justify-end items-center mb-6">
                <button onClick={handleOpenModalForAdd} disabled={clients.length === 0 || services.length === 0} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2 disabled:bg-blue-300 disabled:cursor-not-allowed">
                    <AddIcon className="w-5 h-5" />
                    <span className="font-semibold text-sm">Crear Recibo</span>
                </button>
            </div>

            {sortedInvoices.length > 0 ? (
                <div className="space-y-3">
                    {sortedInvoices.map(invoice => (
                        <InvoiceListItem 
                            key={invoice.id} 
                            invoice={invoice} 
                            client={clientsMap.get(invoice.clientId)} 
                            specialist={invoice.specialistId ? specialistsMap.get(invoice.specialistId) : undefined}
                            onGeneratePdf={handleGeneratePdf}
                            onEdit={() => handleOpenModalForEdit(invoice)}
                            onDelete={() => handleDeleteRequest(invoice.id)}
                            onAddPayment={() => handleOpenPaymentModal(invoice)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg font-semibold text-gray-600">No hay recibos registrados.</p>
                     <p className="text-gray-500">
                        {clients.length === 0 || services.length === 0 
                         ? "Debe agregar clientes y servicios antes de poder generar recibos."
                         : "Presiona 'Crear Recibo' para generar el primero."
                        }
                    </p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingInvoice ? "Editar Recibo" : "Crear Nuevo Recibo"}>
                <InvoiceForm 
                    onClose={closeModal} 
                    clients={clients}
                    services={services}
                    specialists={specialists}
                    managers={managers}
                    onSubmit={handleFormSubmit}
                    initialData={editingInvoice}
                />
            </Modal>

            <Modal isOpen={!!payingInvoice} onClose={() => setPayingInvoice(null)} title={`Abonar a Recibo de ${payingInvoice ? clientsMap.get(payingInvoice.clientId)?.patientName : ''}`}>
                {payingInvoice && (
                    <PaymentForm 
                        onClose={() => setPayingInvoice(null)} 
                        onSubmit={handlePaymentSubmit}
                        maxAmount={payingInvoice.balance}
                    />
                )}
            </Modal>

            <ConfirmationModal
                isOpen={!!deletingInvoiceId}
                onClose={() => setDeletingInvoiceId(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message="¿Está seguro de que desea eliminar este recibo? Esta acción no se puede deshacer."
                confirmText="Sí, Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default InvoicingView;