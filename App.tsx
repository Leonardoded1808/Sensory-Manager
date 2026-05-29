import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

// Import types
import { Page, Client, Service, Invoice, Specialist, TicketConfig, Expense, MedicalRecordEntry, User, Payment, Notification, Appointment, SpecialistExportData, SpecialistMedicalData, Manager, ManagerPayout, WhatsAppTemplate, SpecialistPayout } from './types.ts';

// Import views
import LoginView from './components/LoginView.tsx';
import DashboardView from './components/DashboardView.tsx';
import SpecialistDashboardView from './components/SpecialistDashboardView.tsx';
import ClientsView from './components/ClientsView.tsx';
import ServicesView from './components/ServicesView.tsx';
import InvoicingView from './components/InvoicingView.tsx';
import DebtView from './components/DebtView.tsx';
import ExpensesView from './components/ExpensesView.tsx';
import MedicalHistoryView from './components/MedicalHistoryView.tsx';
import SpecialistsView from './components/SpecialistsView.tsx';
import ManagersView from './components/ManagersView.tsx';
import ManagementView from './components/ManagementView.tsx';
import ReportsView from './components/ReportsView.tsx';
import CalendarView from './components/CalendarView.tsx';
import AutoBackupModal from './components/AutoBackupModal.tsx';

// Import components
import Header from './components/Header.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';
import Notifications from './components/Notifications.tsx';
import Sidebar from './components/Sidebar.tsx';

// Import services
import { getSeedData } from './services/seedData.ts';
import * as db from './services/dbService.ts';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activePage, setActivePage] = useState<Page>('dashboard');
    const [targetClientId, setTargetClientId] = useState<string | null>(null);

    const [isAutoBackupModalOpen, setIsAutoBackupModalOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && currentUser?.role === 'admin') {
            const lastBackupStr = localStorage.getItem('sensory-manager-last-backup');
            const todayStr = new Date().toISOString().split('T')[0];
            if (lastBackupStr !== todayStr) {
                // Short delay so it doesn't pop up instantly on load
                const timer = setTimeout(() => {
                    setIsAutoBackupModalOpen(true);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isLoading, currentUser]);

    const handleNavigateToClient = (clientId: string) => {
        setTargetClientId(clientId);
        setActivePage('clients');
    };
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // App Data State
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [specialistPayouts, setSpecialistPayouts] = useState<SpecialistPayout[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [managerPayouts, setManagerPayouts] = useState<ManagerPayout[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecordEntry[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [ticketConfig, setTicketConfig] = useState<TicketConfig>({});
    const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [adminPassword, setAdminPassword] = useState<string | null>(null);

    const addNotification = (message: string, type: Notification['type'] = 'success') => {
        const newNotif = { id: uuidv4(), message, type };
        setNotifications(prev => [...prev, newNotif]);
    };

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Load data from IndexedDB on initial render, with migration from localStorage
    useEffect(() => {
        const loadAndMigrateData = async () => {
            try {
                await db.openDB();
                const migrationDone = localStorage.getItem('sensory-manager-migrated-to-idb');

                if (!migrationDone) {
                    const lsClients = localStorage.getItem('sensory-manager-clients');
                    if (lsClients) {
                        console.log("Migrating data from localStorage to IndexedDB...");
                        // Load from LS
                        const clientsData = JSON.parse(lsClients);
                        const servicesData = JSON.parse(localStorage.getItem('sensory-manager-services') || '[]');
                        const invoicesData = JSON.parse(localStorage.getItem('sensory-manager-invoices') || '[]');
                        const specialistsData = JSON.parse(localStorage.getItem('sensory-manager-specialists') || '[]');
                        const managersData = JSON.parse(localStorage.getItem('sensory-manager-managers') || '[]');
                        const managerPayoutsData = JSON.parse(localStorage.getItem('sensory-manager-manager-payouts') || '[]');
                        const expensesData = JSON.parse(localStorage.getItem('sensory-manager-expenses') || '[]');
                        const medicalRecordsData = JSON.parse(localStorage.getItem('sensory-manager-medical-records') || '[]');
                        const appointmentsData = JSON.parse(localStorage.getItem('sensory-manager-appointments') || '[]');
                        const ticketConfigData = JSON.parse(localStorage.getItem('sensory-manager-ticket-config') || '{}');
                        const userData = JSON.parse(localStorage.getItem('sensory-manager-user') || 'null');
                        const adminPasswordData = localStorage.getItem('sensory-manager-admin-password');

                        // Save to IDB
                        await db.saveAllData('clients', clientsData);
                        await db.saveAllData('services', servicesData);
                        await db.saveAllData('invoices', invoicesData);
                        await db.saveAllData('specialists', specialistsData);
                        await db.saveAllData('managers', managersData);
                        await db.saveAllData('managerPayouts', managerPayoutsData);
                        await db.saveAllData('expenses', expensesData);
                        await db.saveAllData('medicalRecords', medicalRecordsData);
                        await db.saveAllData('appointments', appointmentsData);
                        await db.putSingleItem('ticketConfig', 'currentConfig', ticketConfigData);
                        if(userData) await db.putSingleItem('user', 'currentUser', userData);
                        if(adminPasswordData) await db.putSingleItem('adminPassword', 'currentPassword', adminPasswordData);

                        // Clean up LS
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith('sensory-manager-')) localStorage.removeItem(key);
                        });
                        localStorage.setItem('sensory-manager-migrated-to-idb', 'true');
                        console.log("Migration complete.");
                    }
                }

                // Load all data from IndexedDB
                const clientsData = await db.getStoreData<Client>('clients');
                if (clientsData.length === 0 && !migrationDone) {
                    console.log("No data found. Seeding initial data...");
                    const { services: seedServices, specialists: seedSpecialists, clients: seedClients } = getSeedData();
                    await db.saveAllData('services', seedServices);
                    await db.saveAllData('specialists', seedSpecialists);
                    await db.saveAllData('clients', seedClients);
                    const defaultPass = '18087350';
                    await db.putSingleItem('adminPassword', 'currentPassword', defaultPass);
                    console.log("Seeding complete. Reloading...");
                    window.location.reload();
                    return;
                }
                
                // Set state from IndexedDB
                setClients(clientsData);
                setServices(await db.getStoreData<Service>('services'));
                setInvoices(await db.getStoreData<Invoice>('invoices'));
                setSpecialists(await db.getStoreData<Specialist>('specialists'));
                setSpecialistPayouts(await db.getStoreData<SpecialistPayout>('specialistPayouts'));
                setManagers(await db.getStoreData<Manager>('managers'));
                setManagerPayouts(await db.getStoreData<ManagerPayout>('managerPayouts'));
                setExpenses(await db.getStoreData<Expense>('expenses'));
                setMedicalRecords(await db.getStoreData<MedicalRecordEntry>('medicalRecords'));
                setAppointments(await db.getStoreData<Appointment>('appointments'));
                setTicketConfig(await db.getSingleItem<TicketConfig>('ticketConfig', 'currentConfig') || {});
                
                const loadedTemplates = await db.getSingleItem<WhatsAppTemplate[]>('ticketConfig', 'whatsappTemplates');
                if (loadedTemplates) {
                    setWhatsappTemplates(loadedTemplates);
                } else {
                    setWhatsappTemplates([{ id: 'default', title: 'Recordatorio Estándar', template: 'Hola {{representante}}, de parte del centro le recordamos que {{paciente}} tiene una cita programada para el {{fecha}} a las {{hora}}. Por favor confirme su asistencia. ¡Le esperamos!' }]);
                }

                const sessionUserStr = sessionStorage.getItem('sensory_current_user');
                if (sessionUserStr) {
                    try {
                        setCurrentUser(JSON.parse(sessionUserStr));
                    } catch (e) {
                        setCurrentUser(null);
                    }
                } else {
                    setCurrentUser(null);
                }
                
                let storedPassword = await db.getSingleItem<string>('adminPassword', 'currentPassword');
                if (!storedPassword) {
                    const defaultPass = '18087350';
                    await db.putSingleItem('adminPassword', 'currentPassword', defaultPass);
                    storedPassword = defaultPass;
                }
                setAdminPassword(storedPassword);

            } catch (error) {
                console.error("Failed to load data from IndexedDB:", error);
                addNotification("Error al cargar la base de datos.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        loadAndMigrateData();
    }, []);

    
    // User Management
    const handleLogin = async (user: User, password?: string) => {
        if (user.role === 'admin') {
            if (password === adminPassword) {
                setCurrentUser(user);
                sessionStorage.setItem('sensory_current_user', JSON.stringify(user));
                await db.putSingleItem('user', 'currentUser', user); // Keep in DB for backup purposes optionally
                setActivePage('dashboard');
            } else {
                addNotification('Contraseña de administrador incorrecta.', 'error');
            }
        } else {
            setCurrentUser(user);
            sessionStorage.setItem('sensory_current_user', JSON.stringify(user));
            await db.putSingleItem('user', 'currentUser', user); // Keep in DB for backup purposes optionally
            setActivePage('dashboard');
        }
    };

    const handleLogout = async () => {
        setCurrentUser(null);
        sessionStorage.removeItem('sensory_current_user');
        await db.deleteItem('user', 'currentUser');
    };
    
    const handleUpdateAdminPassword = async (oldPass: string, newPass: string): Promise<boolean> => {
        if (oldPass !== adminPassword) {
            addNotification('La contraseña actual es incorrecta.', 'error');
            return false;
        }
        setAdminPassword(newPass);
        await db.putSingleItem('adminPassword', 'currentPassword', newPass);
        addNotification('Contraseña de administrador actualizada.');
        return true;
    };

    // CRUD Handlers
    const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
        const newClient = { ...clientData, id: uuidv4(), createdAt: new Date().toISOString() };
        setClients(prev => [...prev, newClient]);
        await db.putItem('clients', newClient);
        addNotification('Cliente agregado exitosamente.');
    };

    const handleUpdateClient = async (updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        await db.putItem('clients', updatedClient);
        addNotification('Cliente actualizado.');
    };
    
    const handleDeleteClient = async (clientId: string) => {
        const invoicesToDelete = invoices.filter(i => i.clientId === clientId);
        const recordsToDelete = medicalRecords.filter(mr => mr.clientId === clientId);
        const appointmentsToDelete = appointments.filter(a => a.clientId === clientId);

        setClients(prev => prev.filter(c => c.id !== clientId));
        setInvoices(prev => prev.filter(i => i.clientId !== clientId));
        setMedicalRecords(prev => prev.filter(mr => mr.clientId !== clientId));
        setAppointments(prev => prev.filter(a => a.clientId !== clientId));

        await db.deleteItem('clients', clientId);
        await Promise.all([
            ...invoicesToDelete.map(i => db.deleteItem('invoices', i.id)),
            ...recordsToDelete.map(r => db.deleteItem('medicalRecords', r.id)),
            ...appointmentsToDelete.map(a => db.deleteItem('appointments', a.id))
        ]);
        addNotification('Cliente y todos sus datos han sido eliminados.', 'info');
    };

    const handleAddService = async (serviceData: Omit<Service, 'id' | 'createdAt'>) => {
        const newService = { ...serviceData, id: uuidv4(), createdAt: new Date().toISOString() };
        setServices(prev => [...prev, newService]);
        await db.putItem('services', newService);
        addNotification('Servicio agregado exitosamente.');
    };

    const handleUpdateService = async (updatedService: Service) => {
        setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
        await db.putItem('services', updatedService);
        addNotification('Servicio actualizado.');
    };

    const handleDeleteService = async (serviceId: string) => {
        if (invoices.some(inv => inv.serviceId === serviceId)) {
            addNotification('No se puede eliminar un servicio que ya ha sido facturado.', 'error');
            return;
        }
        setServices(prev => prev.filter(s => s.id !== serviceId));
        await db.deleteItem('services', serviceId);
        addNotification('Servicio eliminado.', 'info');
    };

    const handleCreateInvoice = async (invoiceData: Omit<Invoice, 'id' | 'balance' | 'status' | 'createdAt' | 'payments'>) => {
        const price = Number(invoiceData.price.toFixed(2));
        const amountPaid = Number(invoiceData.amountPaid.toFixed(2));
        const balance = Number((price - amountPaid).toFixed(2));
        const status = balance <= 0 ? 'Pagada' : (amountPaid > 0 ? 'Abonada' : 'Pendiente');
        
        const initialPayments: Payment[] = amountPaid > 0 ? [{ 
            id: uuidv4(), 
            date: new Date().toISOString().split('T')[0], 
            amount: amountPaid,
        }] : [];

        const newInvoice: Invoice = {
            ...invoiceData,
            price,
            amountPaid,
            id: uuidv4(),
            balance,
            status, 
            createdAt: new Date().toISOString(),
            payments: initialPayments
        };
        
        setInvoices(prev => [...prev, newInvoice]);
        await db.putItem('invoices', newInvoice);
        addNotification('Factura creada exitosamente.');
    };

    const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
        const price = Number(updatedInvoice.price.toFixed(2));
        const amountPaid = Number(updatedInvoice.amountPaid.toFixed(2));
        const balance = Number((price - amountPaid).toFixed(2));
        const status = balance <= 0 ? 'Pagada' : (amountPaid > 0 ? 'Abonada' : 'Pendiente');

        const refinedInvoice = {
            ...updatedInvoice,
            price,
            amountPaid,
            balance,
            status
        };

        setInvoices(prev => prev.map(i => i.id === refinedInvoice.id ? refinedInvoice : i));
        await db.putItem('invoices', refinedInvoice);
        addNotification('Factura actualizada.');
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        await db.deleteItem('invoices', invoiceId);
        addNotification('Factura eliminada.', 'info');
    };

    const handleAddPayment = async (invoiceId: string, paymentData: Omit<Payment, 'id'>) => {
        let invoiceToUpdate: Invoice | undefined;
        setInvoices(prev => prev.map(inv => {
            if (inv.id === invoiceId) {
                const roundedPaymentAmount = Number(paymentData.amount.toFixed(2));
                const newPayment: Payment = { 
                    ...paymentData, 
                    amount: roundedPaymentAmount, 
                    id: uuidv4() 
                };
                const updatedPayments = [...(inv.payments || []), newPayment];
                const newAmountPaid = Number((inv.amountPaid + roundedPaymentAmount).toFixed(2));
                const newBalance = Number((inv.price - newAmountPaid).toFixed(2));
                const newStatus: Invoice['status'] = newBalance <= 0 ? 'Pagada' : 'Abonada';
                invoiceToUpdate = { ...inv, amountPaid: newAmountPaid, balance: newBalance, status: newStatus, payments: updatedPayments };
                return invoiceToUpdate;
            }
            return inv;
        }));
        if (invoiceToUpdate) {
            await db.putItem('invoices', invoiceToUpdate);
        }
        addNotification('Abono registrado exitosamente.');
    };

    const handleAddManager = async (data: Omit<Manager, 'id'>) => {
        const newManager = { ...data, id: uuidv4() };
        setManagers(prev => [...prev, newManager]);
        await db.putItem('managers', newManager);
        addNotification('Gerente agregado.');
    };

    const handleUpdateManager = async (data: Manager) => {
        setManagers(prev => prev.map(m => m.id === data.id ? data : m));
        await db.putItem('managers', data);
        addNotification('Gerente actualizado.');
    };

    const handleDeleteManager = async (id: string) => {
        setManagers(prev => prev.filter(m => m.id !== id));
        await db.deleteItem('managers', id);
        addNotification('Gerente eliminado.', 'info');
    };

    const handleAddManagerPayout = async (data: Omit<ManagerPayout, 'id'>) => {
        const newPayout = { ...data, id: uuidv4() };
        setManagerPayouts(prev => [...prev, newPayout]);
        await db.putItem('managerPayouts', newPayout);
        addNotification('Pago a gerente registrado.');
    };

    const handleUpdateManagerPayout = async (data: ManagerPayout) => {
        setManagerPayouts(prev => prev.map(p => p.id === data.id ? data : p));
        await db.putItem('managerPayouts', data);
        addNotification('Pago a gerente actualizado.');
    };

    const handleDeleteManagerPayout = async (id: string) => {
        setManagerPayouts(prev => prev.filter(p => p.id !== id));
        await db.deleteItem('managerPayouts', id);
        addNotification('Pago a gerente eliminado.');
    };

    const handleAddSpecialistPayout = async (data: Omit<SpecialistPayout, 'id'>) => {
        const newPayout = { ...data, id: uuidv4() };
        setSpecialistPayouts(prev => [...prev, newPayout]);
        await db.putItem('specialistPayouts', newPayout);
        addNotification('Pago a especialista registrado.');
        
        // Also register as expense automatically
        const newExpense: Expense = { 
            id: uuidv4(), 
            description: `Abono a especialista`, 
            amount: data.amount, 
            type: 'Variable', 
            date: data.date 
        };
        setExpenses(prev => [...prev, newExpense]);
        await db.putItem('expenses', newExpense);
    };

    const handleUpdateSpecialistPayout = async (data: SpecialistPayout) => {
        setSpecialistPayouts(prev => prev.map(p => p.id === data.id ? data : p));
        await db.putItem('specialistPayouts', data);
        addNotification('Pago a especialista actualizado.');
    };

    const handleDeleteSpecialistPayout = async (id: string) => {
        setSpecialistPayouts(prev => prev.filter(p => p.id !== id));
        await db.deleteItem('specialistPayouts', id);
        addNotification('Pago a especialista eliminado.');
    };

    const handleSaveTicketConfig = async (config: TicketConfig) => {
        setTicketConfig(config);
        await db.putSingleItem('ticketConfig', 'currentConfig', config);
        addNotification('Configuración de ticket guardada.');
    };

    const handleSaveWhatsappTemplates = async (templates: WhatsAppTemplate[]) => {
        setWhatsappTemplates(templates);
        await db.putSingleItem('ticketConfig', 'whatsappTemplates', templates);
        addNotification('Plantillas de WhatsApp guardadas.');
    };

     const handleAddExpense = async (data: Omit<Expense, 'id'>) => {
        const newExpense: Expense = { ...data, id: uuidv4() };
        setExpenses(prev => [...prev, newExpense]);
        await db.putItem('expenses', newExpense);
        addNotification('Gasto agregado.');
    };

    const handleUpdateExpense = async (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        await db.putItem('expenses', updatedExpense);
        addNotification('Gasto actualizado.');
    };

    const handleDeleteExpense = async (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        await db.deleteItem('expenses', expenseId);
        addNotification('Gasto eliminado.', 'info');
    };

     const handleAddSpecialist = async (data: Omit<Specialist, 'id'>) => {
        const newSpecialist = { ...data, id: uuidv4() };
        setSpecialists(prev => [...prev, newSpecialist]);
        await db.putItem('specialists', newSpecialist);
        addNotification('Especialista agregado.');
    };

    const handleUpdateSpecialist = async (data: Specialist) => {
        setSpecialists(prev => prev.map(s => s.id === data.id ? data : s));
        await db.putItem('specialists', data);
        addNotification('Especialista actualizado.');
    };

    const handleDeleteSpecialist = async (id: string) => {
        setSpecialists(prev => prev.filter(s => s.id !== id));
        setInvoices(prev => prev.map(i => i.specialistId === id ? { ...i, specialistId: undefined, specialistEarnings: undefined } : i));
        setAppointments(prev => prev.filter(a => a.specialistId !== id));

        await db.deleteItem('specialists', id);
        const invoicesToUpdate = invoices.filter(i => i.specialistId === id);
        const appointmentsToDelete = appointments.filter(a => a.specialistId === id);
        await Promise.all([
            ...invoicesToUpdate.map(i => db.putItem('invoices', { ...i, specialistId: undefined, specialistEarnings: undefined })),
            ...appointmentsToDelete.map(a => db.deleteItem('appointments', a.id))
        ]);

        addNotification('Especialista eliminado.', 'info');
    };

     const onAddMedicalRecordEntry = async (data: Omit<MedicalRecordEntry, 'id'>) => {
        const specialistId = currentUser?.role === 'specialist' ? currentUser.id : data.specialistId;
        const newEntry: MedicalRecordEntry = { ...data, id: uuidv4(), specialistId };
        setMedicalRecords(prev => [...prev, newEntry]);
        await db.putItem('medicalRecords', newEntry);
        addNotification('Entrada de historial agregada.');
    };
    
    const onUpdateMedicalRecordEntry = async (data: MedicalRecordEntry) => {
        setMedicalRecords(prev => prev.map(mr => mr.id === data.id ? data : mr));
        await db.putItem('medicalRecords', data);
        addNotification('Entrada de historial actualizada.');
    };

    const onDeleteMedicalRecordEntry = async (id: string) => {
        setMedicalRecords(prev => prev.filter(mr => mr.id !== id));
        await db.deleteItem('medicalRecords', id);
        addNotification('Entrada de historial eliminada.', 'info');
    };

    const handleAddAppointment = async (newAppointments: Omit<Appointment, 'id'>[]) => {
        const appointmentsToAdd = newAppointments.map(appt => ({ ...appt, id: uuidv4() }));
        setAppointments(prev => [...prev, ...appointmentsToAdd]);
        await Promise.all(appointmentsToAdd.map(appt => db.putItem('appointments', appt)));
        addNotification(newAppointments.length > 1 ? `${newAppointments.length} citas agregadas.` : 'Cita agregada.');
    };
    
    const handleUpdateAppointment = async (updatedAppointment: Appointment, updateScope: 'single' | 'all') => {
        const updates: Promise<void>[] = [];
        setAppointments(prev => {
            if (updateScope === 'single' || !updatedAppointment.groupId) {
                updates.push(db.putItem('appointments', updatedAppointment));
                return prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a);
            }
            const originalAppointment = prev.find(a => a.id === updatedAppointment.id);
            if (!originalAppointment) return prev;

            const timeDiff = new Date(updatedAppointment.start).getTime() - new Date(originalAppointment.start).getTime();
            return prev.map(a => {
                if (a.groupId === updatedAppointment.groupId && new Date(a.start) >= new Date(originalAppointment.start)) {
                    const newStart = new Date(new Date(a.start).getTime() + timeDiff);
                    const newEnd = new Date(new Date(a.end).getTime() + timeDiff);
                    const updated = { ...a, ...updatedAppointment, id: a.id, start: newStart.toISOString(), end: newEnd.toISOString() };
                    updates.push(db.putItem('appointments', updated));
                    return updated;
                }
                return a;
            });
        });
        await Promise.all(updates);
        addNotification('Cita actualizada.');
    };
    
    const handleDeleteAppointment = async (appointmentId: string, deleteScope: 'single' | 'all') => {
        const appointmentToDelete = appointments.find(a => a.id === appointmentId);
        if (!appointmentToDelete) return;

        const deletions: Promise<void>[] = [];
        setAppointments(prev => {
            if (deleteScope === 'single' || !appointmentToDelete.groupId) {
                deletions.push(db.deleteItem('appointments', appointmentId));
                return prev.filter(a => a.id !== appointmentId);
            }
            return prev.filter(a => {
                if (a.groupId === appointmentToDelete.groupId && new Date(a.start) >= new Date(appointmentToDelete.start)) {
                    deletions.push(db.deleteItem('appointments', a.id));
                    return false;
                }
                return true;
            });
        });
        await Promise.all(deletions);
        addNotification('Cita(s) eliminada(s).', 'info');
    };

    const handleExportData = async () => {
        const allData = {
            clients: await db.getStoreData('clients'),
            services: await db.getStoreData('services'),
            invoices: await db.getStoreData('invoices'),
            specialists: await db.getStoreData('specialists'),
            specialistPayouts: await db.getStoreData('specialistPayouts'),
            managers: await db.getStoreData('managers'),
            managerPayouts: await db.getStoreData('managerPayouts'),
            expenses: await db.getStoreData('expenses'),
            medicalRecords: await db.getStoreData('medicalRecords'),
            appointments: await db.getStoreData('appointments'),
            ticketConfig: await db.getSingleItem('ticketConfig', 'currentConfig') || {},
        };
        const dataStr = JSON.stringify(allData, null, 2);
        const fileName = `sensory-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        // Try to use native share API (for Android cloud save feature)
        const isIframe = window !== window.top;
        if (!isIframe && navigator.share && navigator.canShare) {
            const file = new File([blob], fileName, { type: 'application/json' });
            try {
                 await navigator.share({
                     files: [file],
                     title: 'Respaldo Base de Datos',
                     text: 'Copia de seguridad de la base de datos del centro médico.'
                 });
                 localStorage.setItem('sensory-manager-last-backup', new Date().toISOString().split('T')[0]);
                 addNotification('Datos protegidos y exportados a la nube.');
                 return;
            } catch (err: any) {
                 if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                     console.warn("Share failed, falling back to download", err);
                 }
            }
        }
        
        // Fallback for desktop/unsupported browsers
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        localStorage.setItem('sensory-manager-last-backup', new Date().toISOString().split('T')[0]);
        addNotification('Datos exportados exitosamente.');
    };

    const handleImportData = async (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            await Promise.all([
                db.saveAllData('clients', data.clients || []),
                db.saveAllData('services', data.services || []),
                db.saveAllData('invoices', data.invoices || []),
                db.saveAllData('specialists', data.specialists || []),
                db.saveAllData('specialistPayouts', data.specialistPayouts || []),
                db.saveAllData('managers', data.managers || []),
                db.saveAllData('managerPayouts', data.managerPayouts || []),
                db.saveAllData('expenses', data.expenses || []),
                db.saveAllData('medicalRecords', data.medicalRecords || []),
                db.saveAllData('appointments', data.appointments || []),
                db.putSingleItem('ticketConfig', 'currentConfig', data.ticketConfig || {}),
            ]);
            addNotification('Datos importados con éxito. Refrescando...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            console.error(e);
            addNotification('Error al importar el archivo. Formato inválido.', 'error');
        }
    };

    const handleImportSpecialistData = async (jsonString: string) => {
        try {
            const data: SpecialistMedicalData = JSON.parse(jsonString);
            if (!data.specialistName || !data.records || !Array.isArray(data.records)) {
                throw new Error("Invalid specialist file format.");
            }
            
            let message = `Importado de ${data.specialistName}: `;

            // Merge records
            if (data.records && Array.isArray(data.records)) {
                let modified = 0;
                setMedicalRecords(prev => {
                    const next = [...prev];
                    data.records.forEach(importedItem => {
                        const index = next.findIndex(i => i.id === importedItem.id);
                        if (index !== -1) {
                            next[index] = { ...next[index], ...importedItem };
                        } else {
                            next.push(importedItem);
                        }
                        db.putItem('medicalRecords', importedItem);
                        modified++;
                    });
                    return next;
                });
                if (modified > 0) message += `${modified} registros actualizados/nuevos. `;
            }

            // Merge clients
            if (data.clients && Array.isArray(data.clients)) {
                let modified = 0;
                setClients(prev => {
                    const next = [...prev];
                    data.clients.forEach(importedItem => {
                        const index = next.findIndex(i => i.id === importedItem.id);
                        if (index !== -1) {
                            next[index] = { ...next[index], ...importedItem };
                        } else {
                            next.push(importedItem);
                        }
                        db.putItem('clients', importedItem);
                        modified++;
                    });
                    return next;
                });
                if (modified > 0) message += `${modified} clientes actualizados/nuevos. `;
            }

            // Merge appointments
            if (data.appointments && Array.isArray(data.appointments)) {
                let modified = 0;
                setAppointments(prev => {
                    const next = [...prev];
                    data.appointments.forEach(importedItem => {
                        const index = next.findIndex(i => i.id === importedItem.id);
                        if (index !== -1) {
                            next[index] = { ...next[index], ...importedItem };
                        } else {
                            next.push(importedItem);
                        }
                        db.putItem('appointments', importedItem);
                        modified++;
                    });
                    return next;
                });
                if (modified > 0) message += `${modified} citas actualizadas/nuevas. `;
            }

            // Merge services
            if (data.services && Array.isArray(data.services)) {
                const existingServiceIds = new Set(services.map(s => s.id));
                const newServices = data.services.filter(srv => !existingServiceIds.has(srv.id));
                if (newServices.length > 0) {
                    setServices(prev => [...prev, ...newServices]);
                    await Promise.all(newServices.map(srv => db.putItem('services', srv)));
                    message += `${newServices.length} servicios. `;
                }
            }
            
            addNotification(message || `No hay datos nuevos para importar de ${data.specialistName}.`);
        } catch (e) {
            console.error(e);
            addNotification('Error al importar datos del especialista.', 'error');
        }
    };

    const handleExportSpecialistJSON = (specialistId: string) => {
        const specialist = specialists.find(s => s.id === specialistId);
        if (!specialist) {
            addNotification('Especialista no encontrado', 'error');
            return;
        }

        const specialistRecords = medicalRecords.filter(r => r.specialistId === specialistId);
        const specialistAppts = appointments.filter(a => a.specialistId === specialistId);
        
        const assignedClientIds = new Set<string>();
        specialistRecords.forEach(r => assignedClientIds.add(r.clientId));
        specialistAppts.forEach(a => assignedClientIds.add(a.clientId));
        invoices.filter(i => i.specialistId === specialistId).forEach(i => assignedClientIds.add(i.clientId));
        
        const specialistClients = clients.filter(c => assignedClientIds.has(c.id));

        const data: SpecialistMedicalData = {
            specialistName: specialist.name,
            exportDate: new Date().toISOString(),
            records: specialistRecords,
            clients: specialistClients,
            appointments: specialistAppts,
            services: services
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Datos_Especialista_${specialist.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addNotification(`Datos de ${specialist.name} exportados exitosamente.`);
    };

    const onExportForSpecialist = (id: string) => {
        const specialist = specialists.find(s => s.id === id);
        if (!specialist) return;
        
        const specialistInvoices = invoices.filter(inv => inv.specialistId === id);
        const specialistPayoutsData = specialistPayouts.filter(p => p.specialistId === id);
        
        let totalPotential = 0;
        let earnedToDate = 0;
        let totalPaid = 0;

        const earningsOwed: { client: string; service: string; amount: number; date: Date }[] = [];
        const earningsPending: { client: string; service: string; amount: number; date: Date }[] = [];

        const clientsMap = new Map(clients.map(c => [c.id, c]));

        specialistInvoices.forEach(inv => {
            const earnings = inv.specialistEarnings || 0;
            totalPotential += earnings;
            if (inv.price > 0) {
                const paidRatio = inv.amountPaid / inv.price;
                const earned = earnings * paidRatio;
                earnedToDate += earned;
                
                const clientName = clientsMap.get(inv.clientId)?.patientName || 'Cliente desconocido';

                if (earned > 0) {
                    earningsOwed.push({ client: clientName, service: inv.serviceName, amount: earned, date: new Date(inv.createdAt) });
                }
                const pending = earnings - earned;
                if (pending > 0.005) {
                    earningsPending.push({ client: clientName, service: inv.serviceName, amount: pending, date: new Date(inv.createdAt) });
                }
            }
        });

        specialistPayoutsData.forEach(p => {
            totalPaid += p.amount;
        });

        const balanceOwed = earnedToDate - totalPaid;

        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 15;
        let y = margin;
    
        // 1. Header
        if (ticketConfig.logo) {
            try {
                const img = new Image();
                img.src = ticketConfig.logo;
                const aspectRatio = img.width / img.height;
                const logoWidth = 25;
                const logoHeight = logoWidth / aspectRatio;
                doc.addImage(ticketConfig.logo, 'PNG', margin, y, logoWidth, logoHeight);
            } catch (e) {
                console.error("Error adding logo to PDF", e);
            }
        }
    
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const companyX = pageW - margin;
        if (ticketConfig.companyName) doc.text(ticketConfig.companyName, companyX, y, { align: 'right' });
        y += 5;
        if (ticketConfig.companyId) doc.text(`RIF: ${ticketConfig.companyId}`, companyX, y, { align: 'right' });
        y += 5;
        if (ticketConfig.address) doc.text(ticketConfig.address, companyX, y, { align: 'right' });
        y += 5;
        if (ticketConfig.phone) doc.text(`Tel: ${ticketConfig.phone}`, companyX, y, { align: 'right' });
        y += 5;
        if (ticketConfig.email) doc.text(ticketConfig.email, companyX, y, { align: 'right' });
    
        y = Math.max(y, margin + 30);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageW - margin, y);
        y += 10;
    
        // 2. Title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('ESTADO DE CUENTA - ESPECIALISTA', margin, y);
    
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, companyX, y, { align: 'right' });
        y += 10;
    
        doc.setFont('helvetica', 'bold');
        doc.text(`Especialista: ${specialist.name}`, margin, y);
        y += 10;

        // 3. Summary
        doc.setFontSize(10);
        doc.text('RESUMEN FINANCIERO', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.text(`Ganancia Potencial Total: $${totalPotential.toFixed(2)}`, margin, y);
        y += 5;
        doc.text(`Comisiones Ganadas (Por cobrar a la empresa): $${earnedToDate.toFixed(2)}`, margin, y);
        y += 5;
        doc.text(`Total Pagado al Especialista: $${totalPaid.toFixed(2)}`, margin, y);
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 0, 0);
        doc.text(`SALDO PENDIENTE A DEBER: $${balanceOwed.toFixed(2)}`, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 12;

        // Function for drawing simple tables
        const drawTable = (title: string, items: any[], colLabels: string[]) => {
            if (items.length === 0) return;
            // check page wrap
            if (y > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                y = margin;
            }

            doc.setFont('helvetica', 'bold');
            doc.text(title, margin, y);
            y += 5;

            const contentW = pageW - margin * 2;
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, y, contentW, 8, 'F');
            doc.text(colLabels[0], margin + 2, y + 5);
            doc.text(colLabels[1], margin + 60, y + 5);
            doc.text(colLabels[2], margin + contentW - 2, y + 5, { align: 'right' });
            y += 8;

            doc.setFont('helvetica', 'normal');
            doc.setDrawColor(200, 200, 200);
            items.forEach((item, i) => {
                if (y > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                    y = margin;
                }
                const isEven = i % 2 === 0;
                if (isEven) {
                    doc.setFillColor(248, 248, 248);
                    doc.rect(margin, y, contentW, 8, 'F');
                }
                doc.rect(margin, y, contentW, 8, 'S');
                doc.text(item.col1, margin + 2, y + 5);
                doc.text(item.col2, margin + 60, y + 5);
                doc.text(item.col3, margin + contentW - 2, y + 5, { align: 'right' });
                y += 8;
            });
            y += 8;
        };

        // 4. Tables
        drawTable('Últimos Pagos Realizados al Especialista', 
            specialistPayoutsData.slice().sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => ({
                col1: new Date(p.date).toLocaleDateString('es-ES'),
                col2: p.notes || 'Abono',
                col3: `$${p.amount.toFixed(2)}`
            })), 
            ['Fecha', 'Descripción', 'Monto']
        );

        drawTable('Comisiones Desbloqueadas (Por Pagar)',
            earningsOwed.slice().sort((a,b)=>b.date.getTime() - a.date.getTime()).map(e => ({
                col1: e.date.toLocaleDateString('es-ES'),
                col2: `${e.client} - ${e.service}`,
                col3: `$${e.amount.toFixed(2)}`
            })),
            ['Fecha', 'Paciente / Servicio', 'Desbloqueado']
        );

        drawTable('Comisiones Bloqueadas (Clientes con deuda)',
            earningsPending.slice().sort((a,b)=>b.date.getTime() - a.date.getTime()).map(e => ({
                col1: e.date.toLocaleDateString('es-ES'),
                col2: `${e.client} - ${e.service}`,
                col3: `$${e.amount.toFixed(2)}`
            })),
            ['Fecha', 'Paciente / Servicio', 'Pendiente']
        );
        
        const pageH = doc.internal.pageSize.getHeight();
        if (ticketConfig.footer) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(9);
            doc.text(ticketConfig.footer, pageW / 2, pageH - 10, { align: 'center' });
        }

        doc.save(`Estado_Cuenta_${specialist.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        addNotification(`Reporte PDF para ${specialist.name} generado.`);
    };

    const renderPage = () => {
        if (currentUser?.role === 'specialist') {
             return <SpecialistDashboardView 
                        currentUser={currentUser} invoices={invoices} clients={clients}
                        specialists={specialists} medicalRecords={medicalRecords}
                        appointments={appointments} ticketConfig={ticketConfig} onAddMedicalRecordEntry={onAddMedicalRecordEntry}
                        onUpdateMedicalRecordEntry={onUpdateMedicalRecordEntry}
                        onDeleteMedicalRecordEntry={onDeleteMedicalRecordEntry}
                        onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment}
                        onDeleteAppointment={handleDeleteAppointment}
                        onImportSpecialistData={handleImportSpecialistData}
                        onExportSpecialistJSON={handleExportSpecialistJSON} />;
        }
        
        switch (activePage) {
            case 'dashboard':
                return <DashboardView clients={clients} invoices={invoices} expenses={expenses} services={services} appointments={appointments} onNavigateToClient={handleNavigateToClient} />;
            case 'clients':
                return <ClientsView clients={clients} invoices={invoices} medicalRecords={medicalRecords} appointments={appointments} whatsappTemplates={whatsappTemplates} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} initialSelectedClientId={targetClientId} onClearSelection={() => setTargetClientId(null)} />;
            case 'services':
                return <ServicesView services={services} invoices={invoices} onAddService={handleAddService} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} />;
            case 'invoicing':
                return <InvoicingView clients={clients} services={services} invoices={invoices} specialists={specialists} managers={managers} ticketConfig={ticketConfig} onCreateInvoice={handleCreateInvoice} onUpdateInvoice={handleUpdateInvoice} onDeleteInvoice={handleDeleteInvoice} onAddPayment={handleAddPayment} />;
            case 'debt':
                return <DebtView clients={clients} invoices={invoices} />;
            case 'expenses':
                return <ExpensesView expenses={expenses} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} />;
            case 'medicalHistory':
                return <MedicalHistoryView clients={clients} medicalRecords={medicalRecords} invoices={invoices} specialists={specialists} currentUser={currentUser!} ticketConfig={ticketConfig} onAddMedicalRecordEntry={onAddMedicalRecordEntry} onUpdateMedicalRecordEntry={onUpdateMedicalRecordEntry} onDeleteMedicalRecordEntry={onDeleteMedicalRecordEntry} />;
            case 'specialists':
                return <SpecialistsView specialists={specialists} services={services} invoices={invoices} specialistPayouts={specialistPayouts} onAddSpecialist={handleAddSpecialist} onUpdateSpecialist={handleUpdateSpecialist} onDeleteSpecialist={handleDeleteSpecialist} onExportForSpecialist={onExportForSpecialist} onAddPayout={handleAddSpecialistPayout} onUpdatePayout={handleUpdateSpecialistPayout} onDeletePayout={handleDeleteSpecialistPayout} />;
            case 'managers':
                return <ManagersView managers={managers} invoices={invoices} managerPayouts={managerPayouts} clients={clients} onAddManager={handleAddManager} onUpdateManager={handleUpdateManager} onDeleteManager={handleDeleteManager} onAddPayout={handleAddManagerPayout} onUpdatePayout={handleUpdateManagerPayout} onDeletePayout={handleDeleteManagerPayout} />;
            case 'management':
                return <ManagementView initialConfig={ticketConfig} whatsappTemplates={whatsappTemplates} specialists={specialists} onSave={handleSaveTicketConfig} onSaveTemplates={handleSaveWhatsappTemplates} onExport={handleExportData} onImport={handleImportData} onImportSpecialistData={handleImportSpecialistData} onExportSpecialistJSON={handleExportSpecialistJSON} onUpdateAdminPassword={handleUpdateAdminPassword} />;
            case 'reports':
                return <ReportsView clients={clients} invoices={invoices} specialists={specialists} services={services} expenses={expenses} />;
            case 'calendar':
                 return <CalendarView 
                            appointments={appointments} clients={clients} specialists={specialists}
                            currentUser={currentUser!} whatsappTemplates={whatsappTemplates} onAddAppointment={handleAddAppointment}
                            onUpdateAppointment={handleUpdateAppointment} onDeleteAppointment={handleDeleteAppointment} />;
            default:
                return <div>Página no encontrada</div>;
        }
    };
    
    const pageTitles: Record<Page, string> = {
        dashboard: "Dashboard", clients: "Gestión de Clientes", services: "Gestión de Servicios",
        invoicing: "Facturación", expenses: "Gestión de Gastos", debt: "Control de Deudas",
        medicalHistory: "Historial Médico", specialists: "Gestión de Especialistas",
        managers: "Gestión de Gerentes", management: "Configuración y Datos",
        reports: "Reportes con IA", calendar: "Calendario de Citas",
    };

    if (isLoading) {
        return <LoadingScreen message="Inicializando base de datos..." />;
    }

    if (!currentUser) {
        return <LoginView specialists={specialists} onLogin={handleLogin} />;
    }

    const MainContent = () => (
         <div className="flex flex-col h-screen bg-gray-100">
            <Header title={pageTitles[activePage] || 'Sensory Manager'} userRole={currentUser.role} onLogout={handleLogout} onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="flex-grow overflow-y-auto pb-20 md:pb-5">
                {currentUser.role === 'admin' && activePage === 'dashboard' && <Notifications services={services} invoices={invoices} appointments={appointments} currentUser={currentUser} clients={clients} specialists={specialists} />}
                {renderPage()}
            </main>
        </div>
    );

    return (
        <div className="flex">
            <Notifications notifications={notifications} onDismiss={dismissNotification} />
            <AutoBackupModal isOpen={isAutoBackupModalOpen} onBackup={() => handleExportData()} onDismiss={() => setIsAutoBackupModalOpen(false)} />
            {currentUser.role === 'admin' && (
                <Sidebar
                    activePage={activePage}
                    onNavigate={(page) => {
                        setActivePage(page);
                        setIsSidebarOpen(false);
                    }}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            )}
            <div className="flex-1 md:ml-64">
                 <MainContent />
            </div>
        </div>
    );
};

export default App;