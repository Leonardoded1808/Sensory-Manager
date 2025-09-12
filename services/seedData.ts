// FIX: Add .ts extension to import path.
import { Client, Service, Specialist } from '../types.ts';

// No longer writes to localStorage, just returns the data for App.tsx to handle.
export const getSeedData = () => {
    const mockServices: Service[] = [
        { id: 'service-1', serviceName: 'Terapia de Lenguaje', price: 50, billingType: 'Por Sesión', createdAt: new Date().toISOString() },
        { id: 'service-2', serviceName: 'Terapia Ocupacional', price: 180, billingType: 'Mensualidad', createdAt: new Date().toISOString() },
        { id: 'service-3', serviceName: 'Evaluación Psicológica', price: 120, billingType: 'Paquete de Sesiones', createdAt: new Date().toISOString() },
        { id: 'service-4', serviceName: 'Apoyo Psicopedagógico', price: 45, billingType: 'Por Sesión', createdAt: new Date().toISOString() },
    ];

    const mockSpecialists: Specialist[] = [
        { id: 'spec-1', name: 'Ana Rodríguez', serviceIds: ['service-1', 'service-4'] },
        { id: 'spec-2', name: 'Carlos Gomez', serviceIds: ['service-2'] },
        { id: 'spec-3', name: 'Lucía Fernandez', serviceIds: ['service-3', 'service-1', 'service-4'] },
    ];

    const mockClients: Client[] = [
        { id: 'client-1', representativeName: 'Maria Perez', patientName: 'Juan Perez', representativeId: 'V-12345678', patientDob: '10/05/2018', createdAt: new Date('2023-01-15T10:00:00Z').toISOString() },
        { id: 'client-2', representativeName: 'Jose Gonzalez', patientName: 'Sofia Gonzalez', representativeId: 'V-87654321', patientDob: '22/08/2019', createdAt: new Date('2023-02-20T11:30:00Z').toISOString() },
        { id: 'client-3', representativeName: 'Elena Martinez', patientName: 'Mateo Martinez', representativeId: 'V-11223344', patientDob: '01/12/2017', createdAt: new Date('2023-03-10T09:00:00Z').toISOString() },
        { id: 'client-4', representativeName: 'Luis Sánchez', patientName: 'Camila Sánchez', representativeId: 'V-55667788', patientDob: '15/03/2020', createdAt: new Date('2023-04-05T14:00:00Z').toISOString() },
        { id: 'client-5', representativeName: 'Ana Ramírez', patientName: 'Lucas Ramírez', representativeId: 'V-99887766', patientDob: '30/01/2019', createdAt: new Date('2023-05-01T16:00:00Z').toISOString() },
    ];
    
    return {
        services: mockServices,
        specialists: mockSpecialists,
        clients: mockClients
    }
};
