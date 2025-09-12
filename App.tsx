import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Import types
import { Page, Client, Service, Invoice, Specialist, TicketConfig, Expense, MedicalRecordEntry, User, Payment, Notification, Appointment, SpecialistExportData, SpecialistMedicalData, Manager, ManagerPayout } from './types.ts';

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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // App Data State
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [managers, setManagers] = useState<Manager[]>([]);
    const [managerPayouts, setManagerPayouts] = useState<ManagerPayout[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [medicalRecords, setMedicalRecords] = useState<MedicalRecordEntry[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [ticketConfig, setTicketConfig] = useState<TicketConfig>({});
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
                setManagers(await db.getStoreData<Manager>('managers'));
                setManagerPayouts(await db.getStoreData<ManagerPayout>('managerPayouts'));
                setExpenses(await db.getStoreData<Expense>('expenses'));
                setMedicalRecords(await db.getStoreData<MedicalRecordEntry>('medicalRecords'));
                setAppointments(await db.getStoreData<Appointment>('appointments'));
                setTicketConfig(await db.getSingleItem<TicketConfig>('ticketConfig', 'currentConfig') || {});
                setCurrentUser(await db.getSingleItem<User>('user', 'currentUser') || null);
                
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
                await db.putSingleItem('user', 'currentUser', user);
                setActivePage('dashboard');
            } else {
                addNotification('Contraseña de administrador incorrecta.', 'error');
            }
        } else {
            setCurrentUser(user);
            await db.putSingleItem('user', 'currentUser', user);
            setActivePage('dashboard');
        }
    };

    const handleLogout = async () => {
        setCurrentUser(null);
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
        const balance = invoiceData.price - invoiceData.amountPaid;
        const status = balance <= 0 ? 'Pagada' : (invoiceData.amountPaid > 0 ? 'Abonada' : 'Pendiente');
        
        const initialPayments: Payment[] = invoiceData.amountPaid > 0 ? [{ 
            id: uuidv4(), 
            date: new Date().toISOString().split('T')[0], 
            amount: invoiceData.amountPaid,
        }] : [];

        const newInvoice: Invoice = {
            ...invoiceData, id: uuidv4(), balance, status, 
            createdAt: new Date().toISOString(), payments: initialPayments
        };
        
        setInvoices(prev => [...prev, newInvoice]);
        await db.putItem('invoices', newInvoice);
        addNotification('Factura creada exitosamente.');
    };

    const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
        setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
        await db.putItem('invoices', updatedInvoice);
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
                const newPayment: Payment = { ...paymentData, id: uuidv4() };
                const updatedPayments = [...(inv.payments || []), newPayment];
                const newAmountPaid = inv.amountPaid + paymentData.amount;
                const newBalance = inv.price - newAmountPaid;
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

    const handleSaveTicketConfig = async (config: TicketConfig) => {
        setTicketConfig(config);
        await db.putSingleItem('ticketConfig', 'currentConfig', config);
        addNotification('Configuración de ticket guardada.');
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
            managers: await db.getStoreData('managers'),
            managerPayouts: await db.getStoreData('managerPayouts'),
            expenses: await db.getStoreData('expenses'),
            medicalRecords: await db.getStoreData('medicalRecords'),
            appointments: await db.getStoreData('appointments'),
            ticketConfig: await db.getSingleItem('ticketConfig', 'currentConfig') || {},
        };
        const dataStr = JSON.stringify(allData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sensory-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
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
            const existingRecordIds = new Set(medicalRecords.map(r => r.id));
            const newRecords = data.records.filter(rec => !existingRecordIds.has(rec.id));
            
            if (newRecords.length > 0) {
                setMedicalRecords(prev => [...prev, ...newRecords]);
                await Promise.all(newRecords.map(rec => db.putItem('medicalRecords', rec)));
                addNotification(`${newRecords.length} nuevo(s) registro(s) importado(s) de ${data.specialistName}.`);
            } else {
                addNotification(`No hay registros nuevos para importar de ${data.specialistName}.`, 'info');
            }
        } catch (e) {
            console.error(e);
            addNotification('Error al importar datos del especialista.', 'error');
        }
    };

    const onExportForSpecialist = (id: string) => {
        const specialist = specialists.find(s => s.id === id);
        if (!specialist) return;
        
        const specialistInvoices = invoices.filter(inv => inv.specialistId === id);
        const assignedClientIds = new Set(specialistInvoices.map(inv => inv.clientId));
        const assignedPatients = clients.filter(c => assignedClientIds.has(c.id));

        let owedByCompany = 0;
        let pendingFromClients = 0;

        specialistInvoices.forEach(inv => {
            const earnings = inv.specialistEarnings || 0;
            if (inv.status === 'Pagada') {
                owedByCompany += earnings;
            } else {
                pendingFromClients += earnings;
            }
        });

        const exportData: SpecialistExportData = {
            specialist,
            assignedPatients,
            invoices: specialistInvoices,
            financialSummary: { owedByCompany, pendingFromClients, totalPotentialEarnings: owedByCompany + pendingFromClients }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte-${specialist.name.replace(/\s/g, '_')}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        addNotification(`Reporte para ${specialist.name} exportado.`);
    };

    const renderPage = () => {
        if (currentUser?.role === 'specialist') {
             return <SpecialistDashboardView 
                        currentUser={currentUser} invoices={invoices} clients={clients}
                        specialists={specialists} medicalRecords={medicalRecords}
                        appointments={appointments} onAddMedicalRecordEntry={onAddMedicalRecordEntry}
                        onUpdateMedicalRecordEntry={onUpdateMedicalRecordEntry}
                        onDeleteMedicalRecordEntry={onDeleteMedicalRecordEntry}
                        onAddAppointment={handleAddAppointment} onUpdateAppointment={handleUpdateAppointment}
                        onDeleteAppointment={handleDeleteAppointment} />;
        }
        
        switch (activePage) {
            case 'dashboard':
                return <DashboardView clients={clients} invoices={invoices} expenses={expenses} services={services} appointments={appointments} />;
            case 'clients':
                return <ClientsView clients={clients} invoices={invoices} medicalRecords={medicalRecords} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} />;
            case 'services':
                return <ServicesView services={services} invoices={invoices} onAddService={handleAddService} onUpdateService={handleUpdateService} onDeleteService={handleDeleteService} />;
            case 'invoicing':
                return <InvoicingView clients={clients} services={services} invoices={invoices} specialists={specialists} managers={managers} ticketConfig={ticketConfig} onCreateInvoice={handleCreateInvoice} onUpdateInvoice={handleUpdateInvoice} onDeleteInvoice={handleDeleteInvoice} onAddPayment={handleAddPayment} />;
            case 'debt':
                return <DebtView clients={clients} invoices={invoices} />;
            case 'expenses':
                return <ExpensesView expenses={expenses} onAddExpense={handleAddExpense} onUpdateExpense={handleUpdateExpense} onDeleteExpense={handleDeleteExpense} />;
            case 'medicalHistory':
                return <MedicalHistoryView clients={clients} medicalRecords={medicalRecords} invoices={invoices} specialists={specialists} currentUser={currentUser!} onAddMedicalRecordEntry={onAddMedicalRecordEntry} onUpdateMedicalRecordEntry={onUpdateMedicalRecordEntry} onDeleteMedicalRecordEntry={onDeleteMedicalRecordEntry} />;
            case 'specialists':
                return <SpecialistsView specialists={specialists} services={services} onAddSpecialist={handleAddSpecialist} onUpdateSpecialist={handleUpdateSpecialist} onDeleteSpecialist={handleDeleteSpecialist} onExportForSpecialist={onExportForSpecialist} />;
            case 'managers':
                return <ManagersView managers={managers} invoices={invoices} managerPayouts={managerPayouts} clients={clients} onAddManager={handleAddManager} onUpdateManager={handleUpdateManager} onDeleteManager={handleDeleteManager} onAddPayout={handleAddManagerPayout} />;
            case 'management':
                return <ManagementView initialConfig={ticketConfig} onSave={handleSaveTicketConfig} onExport={handleExportData} onImport={handleImportData} onImportSpecialistData={handleImportSpecialistData} onUpdateAdminPassword={handleUpdateAdminPassword} />;
            case 'reports':
                return <ReportsView clients={clients} invoices={invoices} specialists={specialists} services={services} expenses={expenses} />;
            case 'calendar':
                 return <CalendarView 
                            appointments={appointments} clients={clients} specialists={specialists}
                            currentUser={currentUser!} onAddAppointment={handleAddAppointment}
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