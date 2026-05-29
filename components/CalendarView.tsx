import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Appointment, Client, Specialist, User, WhatsAppTemplate } from '../types.ts';
import Modal, { ConfirmationModal } from './Modal.tsx';
import { AddIcon, EditIcon, TrashIcon, ChevronRightIcon, BackIcon, CalendarPlusIcon, WhatsAppIcon } from './icons.tsx';

interface CalendarViewProps {
    appointments: Appointment[];
    clients: Client[];
    specialists: Specialist[];
    currentUser: User;
    whatsappTemplates: WhatsAppTemplate[];
    onAddAppointment: (newAppointments: Omit<Appointment, 'id'>[]) => Promise<void>;
    onUpdateAppointment: (updatedAppointment: Appointment, scope: 'single' | 'all') => Promise<void>;
    onDeleteAppointment: (appointmentId: string, scope: 'single' | 'all') => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, clients, specialists, currentUser, whatsappTemplates, onAddAppointment, onUpdateAppointment, onDeleteAppointment }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [deleteRequest, setDeleteRequest] = useState<{ id: string; scope: 'single' | 'all' } | null>(null);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
    const specialistMap = useMemo(() => new Map(specialists.map(s => [s.id, s])), [specialists]);
    
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const startingDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const appointmentsByDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        appointments.forEach(appt => {
            const dateKey = new Date(appt.start).toISOString().split('T')[0];
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(appt);
        });
        return map;
    }, [appointments]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    
    const handleAddClick = () => {
        setEditingAppointment(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (appt: Appointment) => {
        setEditingAppointment(appt);
        setSelectedAppointment(null);
        setIsFormOpen(true);
    };
    
    const handleDeleteRequest = (id: string, groupId?: string) => {
        if (groupId) {
             // For recurring, we handle the choice in the detail view
             setSelectedAppointment(prev => prev ? {...prev, _showDeleteOptions: true} as any : null);
        } else {
            setDeleteRequest({ id, scope: 'single' });
        }
    };
    
    const confirmDelete = () => {
        if(deleteRequest){
            onDeleteAppointment(deleteRequest.id, deleteRequest.scope);
            setDeleteRequest(null);
            setSelectedAppointment(null);
        }
    };
    
    const handleFormSubmit = async (data: Omit<Appointment, 'id' | 'groupId'> | Appointment, recurrence?: { endDate: string }) => {
        if (recurrence) {
            const newAppointments: Omit<Appointment, 'id'>[] = [];
            const groupId = uuidv4();
            let current = new Date(data.start);
            const endRecurrence = new Date(recurrence.endDate);
            endRecurrence.setHours(23, 59, 59, 999);

            while (current <= endRecurrence) {
                const duration = new Date(data.end).getTime() - new Date(data.start).getTime();
                const newEnd = new Date(current.getTime() + duration);
                newAppointments.push({ ...data, start: current.toISOString(), end: newEnd.toISOString(), groupId });
                current.setDate(current.getDate() + 7); // Weekly recurrence
            }
            await onAddAppointment(newAppointments);
        } else if ('id' in data) {
             await onUpdateAppointment(data, 'single'); // For simplicity, only update single instance from form
        } else {
             await onAddAppointment([{ ...data }]);
        }
        setIsFormOpen(false);
    };

    const handleShareWhatsApp = (appt: Appointment, templateBody: string | null) => {
        if (!appt.clientId) return;
        const client = clientMap.get(appt.clientId);
        const specialist = specialistMap.get(appt.specialistId);
        const date = new Date(appt.start).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const time = new Date(appt.start).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

        const phone = client?.phone?.replace(/\D/g, '') || '';
        if (!phone) {
            alert('El paciente no tiene un número de teléfono registrado.');
            return;
        }

        if (templateBody === null) {
            // Direct message
            window.open(`https://wa.me/${phone}`, '_blank');
        } else if (templateBody === 'default') {
            // Default hardcoded message
            const message = `*Recordatorio de Cita - Sensory Manager*%0A%0A` +
                            `*Paciente:* ${client?.patientName || 'N/A'}%0A` +
                            `*Especialista:* ${specialist?.name || 'N/A'}%0A` +
                            `*Fecha:* ${date}%0A` +
                            `*Hora:* ${time}%0A%0A` +
                            `*Notas:* ${appt.notes || 'Ninguna'}`;
            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        } else {
            // Custom template
            let message = templateBody;
            message = message.replace(/\{\{paciente\}\}/g, client?.patientName || '');
            message = message.replace(/\{\{representante\}\}/g, client?.representativeName || '');
            message = message.replace(/\{\{fecha\}\}/g, date);
            message = message.replace(/\{\{hora\}\}/g, time);
            
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
        setShowTemplateSelector(false);
    };

    return (
        <div className="p-5 animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-200"><BackIcon className="w-5 h-5"/></button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-200"><ChevronRightIcon className="w-5 h-5"/></button>
                    <button onClick={handleAddClick} className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center space-x-2 ml-4">
                        <CalendarPlusIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">Agendar</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-xl shadow-md">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => <div key={index} className="text-center font-bold text-sm text-gray-500 py-2">{day}</div>)}
                {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`} className="border border-gray-100 rounded-md h-24 sm:h-28"></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const dayNumber = day + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                    const dateKey = date.toISOString().split('T')[0];
                    const dayAppointments = appointmentsByDate.get(dateKey) || [];
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                        <div key={day} className="border border-gray-100 rounded-md h-24 sm:h-28 p-1 flex flex-col">
                            <span className={`font-bold text-xs ${isToday ? 'bg-blue-600 text-white rounded-full flex items-center justify-center h-5 w-5' : 'text-gray-700'}`}>{dayNumber}</span>
                             <div className="overflow-y-auto mt-1 space-y-1">
                                {dayAppointments.map(appt => (
                                    <button key={appt.id} onClick={() => setSelectedAppointment(appt)} className={`w-full text-left text-xs p-1 rounded hover:opacity-80 truncate ${appt.clientId ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                        {appt.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedAppointment && (
                <Modal isOpen={!!selectedAppointment} onClose={() => setSelectedAppointment(null)} title={selectedAppointment.title}>
                    <div className="space-y-4">
                        {selectedAppointment.clientId && <p><strong className="text-gray-300">Paciente:</strong> {clientMap.get(selectedAppointment.clientId)?.patientName}</p>}
                        <p><strong className="text-gray-300">Especialista:</strong> {specialistMap.get(selectedAppointment.specialistId)?.name}</p>
                        <p><strong className="text-gray-300">Fecha:</strong> {new Date(selectedAppointment.start).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong className="text-gray-300">Hora:</strong> {new Date(selectedAppointment.start).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' })} - {new Date(selectedAppointment.end).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' })}</p>
                        <p><strong className="text-gray-300">Notas:</strong> {selectedAppointment.notes || "N/A"}</p>
                        
                        {(selectedAppointment as any)._showDeleteOptions ? (
                            <div className="p-3 bg-red-900/50 rounded-lg space-y-3">
                                <p className="font-bold text-white">Esta es una cita recurrente. ¿Cómo desea eliminarla?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteRequest({ id: selectedAppointment.id, scope: 'single' })} className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg">Solo esta</button>
                                    <button onClick={() => setDeleteRequest({ id: selectedAppointment.id, scope: 'all' })} className="flex-1 bg-red-800 text-white font-bold py-2 rounded-lg">Esta y futuras</button>
                                </div>
                            </div>
                        ) : (
                             <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                                <div className="flex gap-2">
                                    <button onClick={() => handleEditClick(selectedAppointment)} className="p-2 text-gray-300 hover:text-blue-400 bg-slate-700 rounded-full"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDeleteRequest(selectedAppointment.id, selectedAppointment.groupId)} className="p-2 text-gray-300 hover:text-red-400 bg-slate-700 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                                {selectedAppointment.clientId && (
                                    <div className="relative">
                                        <button onClick={() => setShowTemplateSelector(!showTemplateSelector)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                            <WhatsAppIcon className="w-5 h-5"/>
                                            <span className="font-semibold text-sm">Avisar por WhatsApp</span>
                                        </button>
                                        {showTemplateSelector && (
                                            <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden divide-y divide-gray-100">
                                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                                    <p className="text-xs font-bold text-gray-500 uppercase">Seleccionar Plantilla</p>
                                                    <button onClick={() => setShowTemplateSelector(false)} className="text-gray-400 hover:text-gray-600">×</button>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    <button 
                                                        onClick={() => handleShareWhatsApp(selectedAppointment, null)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                    >
                                                        <p className="font-bold text-sm text-gray-800">Mensaje Directo</p>
                                                        <p className="text-xs text-gray-500 truncate">Escribir sin plantilla...</p>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleShareWhatsApp(selectedAppointment, 'default')}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                    >
                                                        <p className="font-bold text-sm text-gray-800">Recordatorio Básico</p>
                                                        <p className="text-xs text-gray-500 truncate">Plantilla predeterminada...</p>
                                                    </button>
                                                    {whatsappTemplates.length > 0 && whatsappTemplates.map(template => (
                                                        <button 
                                                            key={template.id}
                                                            onClick={() => handleShareWhatsApp(selectedAppointment, template.template)}
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <p className="font-bold text-sm text-gray-800">{template.title}</p>
                                                            <p className="text-xs text-gray-500 truncate">{template.template}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Modal>
            )}
            
             {isFormOpen && (
                <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingAppointment ? "Editar Evento" : "Agendar Nuevo Evento"}>
                    <AppointmentForm
                        clients={clients}
                        specialists={specialists}
                        currentUser={currentUser}
                        initialData={editingAppointment}
                        onClose={() => setIsFormOpen(false)}
                        onSubmit={handleFormSubmit}
                    />
                </Modal>
            )}
            
            <ConfirmationModal
                isOpen={!!deleteRequest}
                onClose={() => setDeleteRequest(null)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
                message={`¿Está seguro de que desea eliminar ${deleteRequest?.scope === 'all' ? 'este evento y todos los futuros' : 'este evento'}?`}
            />
        </div>
    );
};


const AppointmentForm: React.FC<{
    onClose: () => void;
    onSubmit: (data: Omit<Appointment, 'id' | 'groupId'> | Appointment, recurrence?: { endDate: string }) => Promise<void>;
    clients: Client[];
    specialists: Specialist[];
    currentUser: User;
    initialData?: Appointment | null;
}> = ({ onClose, onSubmit, clients, specialists, currentUser, initialData }) => {
    
    const [eventType, setEventType] = useState<'appointment' | 'task'>(initialData?.clientId ? 'appointment' : 'task');
    const [isRecurring, setIsRecurring] = useState(false);
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const date = formData.get('date') as string;
        const startTime = formData.get('startTime') as string;
        const endTime = formData.get('endTime') as string;
        
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        if (end <= start) {
            alert('La hora de fin debe ser posterior a la hora de inicio.');
            return;
        }

        const title = eventType === 'appointment'
            ? clients.find(c => c.id === formData.get('clientId'))?.patientName || 'Cita sin nombre'
            : formData.get('title') as string;
            
        if (!title) {
            alert('El título de la tarea es obligatorio.');
            return;
        }

        const data = {
            title,
            clientId: eventType === 'appointment' ? formData.get('clientId') as string : undefined,
            specialistId: formData.get('specialistId') as string,
            notes: formData.get('notes') as string,
            start: start.toISOString(),
            end: end.toISOString(),
        };

        const recurrence = isRecurring ? { endDate: formData.get('endDate') as string } : undefined;
        if(recurrence && new Date(recurrence.endDate) < start) {
            alert('La fecha de fin de la recurrencia debe ser posterior a la fecha de la cita.');
            return;
        }

        onSubmit(initialData ? { ...initialData, ...data } : data, recurrence);
    };

    const availableSpecialists = currentUser.role === 'admin' ? specialists : specialists.filter(s => s.id === currentUser.id);

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center p-1 bg-slate-700 rounded-lg">
                <button type="button" onClick={() => setEventType('appointment')} className={`w-1/2 py-2 text-sm font-bold rounded-md ${eventType === 'appointment' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}>Cita con Paciente</button>
                <button type="button" onClick={() => setEventType('task')} className={`w-1/2 py-2 text-sm font-bold rounded-md ${eventType === 'task' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}>Tarea / Actividad</button>
            </div>
            
            {eventType === 'appointment' ? (
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Paciente</label>
                    <select name="clientId" defaultValue={initialData?.clientId} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" required>
                        <option value="" disabled>Seleccionar...</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.patientName}</option>)}
                    </select>
                </div>
            ) : (
                 <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Título de la Tarea</label>
                    <input type="text" name="title" defaultValue={initialData?.title} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" placeholder="Ej: Reunión de equipo" required />
                </div>
            )}
             <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Especialista Asignado</label>
                <select name="specialistId" defaultValue={initialData?.specialistId || (availableSpecialists.length === 1 ? availableSpecialists[0].id : '')} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" required>
                    <option value="" disabled>Seleccionar...</option>
                    {availableSpecialists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Fecha</label>
                <input type="date" name="date" defaultValue={initialData ? initialData.start.split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" style={{ colorScheme: 'dark' }} required />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Hora de Inicio</label>
                    <input type="time" name="startTime" defaultValue={initialData ? new Date(initialData.start).toTimeString().substring(0,5) : '09:00'} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" style={{ colorScheme: 'dark' }} required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-300 mb-1">Hora de Fin</label>
                    <input type="time" name="endTime" defaultValue={initialData ? new Date(initialData.end).toTimeString().substring(0,5) : '10:00'} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" style={{ colorScheme: 'dark' }} required />
                </div>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Notas (Opcional)</label>
                <textarea name="notes" rows={2} defaultValue={initialData?.notes} className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" />
            </div>
             {!initialData && (
                 <div className="space-y-3 pt-2">
                    <div className="flex items-center">
                        <input id="isRecurring" type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600"/>
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-200">Evento recurrente (semanal)</label>
                    </div>
                    {isRecurring && (
                        <div>
                             <label className="block text-sm font-bold text-gray-300 mb-1">Repetir hasta</label>
                             <input type="date" name="endDate" className="w-full p-3 bg-slate-700 border border-slate-600 text-white rounded-lg" style={{ colorScheme: 'dark' }} required={isRecurring} />
                        </div>
                    )}
                 </div>
             )}
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-600 text-gray-200 font-bold rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg">Guardar Evento</button>
            </div>
        </form>
    );
};


export default CalendarView;