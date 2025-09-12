import React, { useMemo, useEffect } from 'react';
// FIX: Import `Notification` type and replace non-existent icons with available ones.
import { Invoice, Service, Appointment, User, Client, Specialist, Notification } from '../types.ts';
import { DebtIcon, CalendarIcon, InvoicingIcon } from './icons.tsx';

// FIX: Combined props interface to support both toast notifications and dashboard alerts.
interface NotificationsProps {
    // For dashboard alerts
    services?: Service[];
    invoices?: Invoice[];
    appointments?: Appointment[];
    clients?: Client[];
    specialists?: Specialist[];
    currentUser?: User;

    // For toast notifications
    notifications?: Notification[];
    onDismiss?: (id: string) => void;
}


const ToastItem: React.FC<{ notification: Notification, onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const typeClasses = {
        success: 'bg-green-100 border-green-500 text-green-800',
        error: 'bg-red-100 border-red-500 text-red-800',
        info: 'bg-blue-100 border-blue-500 text-blue-800',
    };

    return (
        <div className={`w-80 p-4 rounded-lg shadow-lg border-l-4 ${typeClasses[notification.type]} animate-fadeIn`}>
            <div className="flex items-start">
                <p className="flex-grow text-sm font-medium">{notification.message}</p>
                <button onClick={() => onDismiss(notification.id)} className="ml-4 -mt-1 -mr-1 flex-shrink-0 text-gray-500 hover:text-gray-800 font-bold text-lg">&times;</button>
            </div>
        </div>
    );
}

const DashboardAlertItem: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; type: 'warning' | 'info' }> = ({ icon, title, children, type }) => {
    const colorClasses = {
        warning: 'border-red-500 bg-red-50',
        info: 'border-blue-500 bg-blue-50',
    };

    return (
        <div className={`p-4 rounded-xl border-l-4 ${colorClasses[type]}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                    <p className="font-bold text-gray-800">{title}</p>
                    <div className="text-sm text-gray-600 space-y-1 mt-1">{children}</div>
                </div>
            </div>
        </div>
    );
};

const Notifications: React.FC<NotificationsProps> = ({ services, invoices, appointments, clients, specialists, currentUser, notifications, onDismiss }) => {

    // FIX: Render toast notifications if `notifications` and `onDismiss` props are provided.
    if (notifications && onDismiss) {
        return (
            <div className="fixed top-5 right-5 z-50 space-y-3">
                {notifications.map(notif => (
                    <ToastItem key={notif.id} notification={notif} onDismiss={onDismiss!} />
                ))}
            </div>
        )
    }

    // FIX: Guard clause for required props for dashboard alerts.
    if (!services || !invoices || !appointments || !clients || !specialists || !currentUser) {
        return null;
    }

    const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);
    const specialistMap = useMemo(() => new Map(specialists.map(s => [s.id, s])), [specialists]);
    
    const overduePayments = useMemo(() => {
        if (currentUser.role === 'specialist') return []; // Only for admin
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return invoices
            .filter(inv => inv.balance > 0 && new Date(inv.createdAt) < thirtyDaysAgo)
            .map(inv => ({ invoice: inv, client: clientMap.get(inv.clientId) }))
            .filter(item => !!item.client);
    }, [invoices, clientMap, currentUser]);

    const upcomingRenewals = useMemo(() => {
        if (currentUser.role === 'specialist') return []; // Only for admin
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const monthlyServices = new Set(services.filter(s => s.billingType === 'Mensualidad').map(s => s.id));
        return invoices
            .filter(inv => monthlyServices.has(inv.serviceId))
            .map(inv => {
                const lastPaymentDate = new Date(inv.createdAt);
                const nextBillingDate = new Date(lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 1));
                return { invoice: inv, client: clientMap.get(inv.clientId), nextBillingDate };
            })
            .filter(item => item.client && item.nextBillingDate < sevenDaysFromNow && item.nextBillingDate > new Date());
    }, [invoices, services, clientMap, currentUser]);

    const upcomingAppointments = useMemo(() => {
        const now = new Date();
        const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        return appointments
            .filter(appt => {
                const apptDate = new Date(appt.start);
                const isUpcoming = apptDate > now && apptDate < twentyFourHoursFromNow;
                if (!isUpcoming) return false;
                if (currentUser.role === 'specialist' && appt.specialistId !== currentUser.id) return false;
                return true;
            })
            .map(appt => ({
                appointment: appt,
                client: appt.clientId ? clientMap.get(appt.clientId) : undefined,
                specialist: specialistMap.get(appt.specialistId),
            }))
            .filter(item => !!item.specialist) // Specialist is always required
            .sort((a, b) => new Date(a.appointment.start).getTime() - new Date(b.appointment.start).getTime());

    }, [appointments, clientMap, specialistMap, currentUser]);


    if (overduePayments.length === 0 && upcomingRenewals.length === 0 && upcomingAppointments.length === 0) {
        return null;
    }

    return (
        <div className="p-5 animate-fadeIn space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Alertas y Recordatorios</h3>
            
            {upcomingAppointments.length > 0 && (
                <DashboardAlertItem icon={<CalendarIcon className="w-6 h-6 text-blue-600" />} title="Próximos Eventos (24h)" type="info">
                    {upcomingAppointments.map(({ appointment, client, specialist }) => (
                         <div key={appointment.id}>
                            <p>
                                {client ? 
                                    <>
                                        <span className="font-semibold">{client.patientName}</span> con <span className="font-semibold">{specialist?.name}</span>
                                    </> : 
                                    <>
                                        <span className="font-semibold">{appointment.title}</span> ({specialist?.name})
                                    </>
                                }
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(appointment.start).toLocaleDateString('es-ES', { weekday: 'long', hour: 'numeric', minute: 'numeric', hour12: true })}
                            </p>
                        </div>
                    ))}
                </DashboardAlertItem>
            )}

            {overduePayments.length > 0 && (
                // FIX: Replaced non-existent WarningIcon with DebtIcon.
                <DashboardAlertItem icon={<DebtIcon className="w-6 h-6 text-red-600" />} title="Pagos Atrasados" type="warning">
                     {overduePayments.map(({ invoice, client }) => (
                        <div key={invoice.id} className="flex justify-between items-center">
                            <div>
                                <p><span className="font-semibold">{client?.representativeName}</span> debe ${invoice.balance.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Factura de {invoice.serviceName}</p>
                            </div>
                            <button className="text-xs bg-red-100 text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-200">
                                Recordar
                            </button>
                        </div>
                    ))}
                </DashboardAlertItem>
            )}

            {upcomingRenewals.length > 0 && (
                // FIX: Replaced non-existent BellIcon with InvoicingIcon.
                <DashboardAlertItem icon={<InvoicingIcon className="w-6 h-6 text-blue-600" />} title="Renovaciones Próximas" type="info">
                    {upcomingRenewals.map(({ invoice, client, nextBillingDate }) => (
                        <div key={invoice.id}>
                            <p>
                                <span className="font-semibold">{client?.representativeName}</span> para {invoice.serviceName}
                            </p>
                            <p className="text-xs text-gray-500">
                                Próximo cobro el {nextBillingDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                            </p>
                        </div>
                    ))}
                </DashboardAlertItem>
            )}
        </div>
    );
};

export default Notifications;