

// FIX: Add .ts extension to import path.
import { Client, DebtInfo, Invoice } from '../types.ts';

export const calculateAllDebts = (clients: Client[], invoices: Invoice[]): DebtInfo[] => {
    const debtMap: { [clientId: string]: DebtInfo } = {};

    invoices.forEach(invoice => {
        if (invoice.balance > 0) {
            if (!debtMap[invoice.clientId]) {
                const client = clients.find(c => c.id === invoice.clientId);
                if (client) {
                    debtMap[invoice.clientId] = {
                        client,
                        totalDebt: 0,
                        pendingInvoices: [],
                    };
                }
            }

            if (debtMap[invoice.clientId]) {
                debtMap[invoice.clientId].totalDebt += invoice.balance;
                debtMap[invoice.clientId].pendingInvoices.push(invoice);
            }
        }
    });

    return Object.values(debtMap);
};

export const calculateDebtForClient = (client: Client, invoices: Invoice[]): DebtInfo | null => {
    const clientInvoices = invoices.filter(inv => inv.clientId === client.id && inv.balance > 0);

    if (clientInvoices.length === 0) {
        return null;
    }

    const totalDebt = clientInvoices.reduce((sum, inv) => sum + inv.balance, 0);

    return {
        client,
        totalDebt,
        pendingInvoices: clientInvoices,
    };
};