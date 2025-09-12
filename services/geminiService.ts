

import { GoogleGenAI } from "@google/genai";
// FIX: Add .ts extension to import path.
import { Client, DebtInfo, Invoice, MedicalRecordEntry, MedicalReportData, Specialist, Service, Expense } from '../types.ts';

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateBusinessSummary = async (clients: Client[], invoices: Invoice[]): Promise<string> => {
    const reportData = {
        totalClients: clients.length,
        totalInvoices: invoices.length,
        invoicingSummary: invoices.map(inv => ({
            serviceName: inv.serviceName,
            price: inv.price,
            amountPaid: inv.amountPaid,
            balance: inv.balance,
            status: inv.status,
            date: new Date(inv.createdAt).toLocaleDateString('es-ES')
        }))
    };

    const prompt = `
        You are a business analyst for a small therapy practice. Based on the following data about clients and their invoices, generate a concise business summary in Spanish. The summary should be well-structured with clear headings and bullet points.

        The summary should include:
        1.  **Resumen General:** A brief overview of the active client base and total amount invoiced.
        2.  **Análisis de Facturación:** Breakdown of total invoiced, total collected, and total pending balance.
        3.  **Popularidad de Servicios:** A breakdown of service popularity based on how many times each service has been invoiced.
        4.  **Sugerencias Estratégicas:** Provide actionable suggestions based on the invoicing data. For example, identify services with high balances to suggest better payment policies, or promote highly popular services.

        Here is the data in JSON format:
        ${JSON.stringify(reportData)}

        Please format the output clearly.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating report with Gemini:", error);
        return "Error: No se pudo generar el reporte. Por favor, intente de nuevo más tarde.";
    }
};

export const generateSpecialistReport = async (specialists: Specialist[], invoices: Invoice[], services: Service[]): Promise<string> => {
    const reportData = specialists.map(sp => {
        const specialistInvoices = invoices.filter(inv => inv.specialistId === sp.id);
        const totalEarnings = specialistInvoices.reduce((sum, inv) => sum + (inv.specialistEarnings || 0), 0);
        const serviceNames = services.filter(s => sp.serviceIds.includes(s.id)).map(s => s.serviceName);
        return {
            name: sp.name,
            totalEarnings: totalEarnings.toFixed(2),
            servicesProvidedCount: specialistInvoices.length,
            specializesIn: serviceNames,
        };
    });

    const prompt = `
        Eres un consultor de negocios para un centro de terapia. Basado en los siguientes datos, genera un informe detallado en español sobre los especialistas.

        Datos:
        ${JSON.stringify(reportData, null, 2)}

        El informe debe incluir:
        1.  **Resumen General:** Un breve panorama del número de especialistas y su contribución colectiva.
        2.  **Desglose por Especialista:** Para cada especialista, proporciona un resumen que incluya:
            - Ganancias Totales.
            - Número de Servicios Facturados.
            - Áreas de Especialización (los servicios que provee).
        3.  **Análisis Comparativo:** Identifica al especialista con las mayores ganancias y al que ha proporcionado más servicios.
        4.  **Sugerencias Estratégicas:** Proporciona 1-2 sugerencias accionables. Por ejemplo, sugiere reconocer a los de mejor desempeño, ofrecer capacitación a otros o equilibrar la carga de trabajo si existen disparidades significativas.
        
        Formatea la salida claramente usando **markdown** para los títulos y viñetas.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating specialist report with Gemini:", error);
        return "Error: No se pudo generar el reporte de especialistas.";
    }
};

export const generateDebtReport = async (debtInfo: DebtInfo[]): Promise<string> => {
    const totalDebt = debtInfo.reduce((sum, debt) => sum + debt.totalDebt, 0);
    const clientsWithDebt = debtInfo.length;

    const reportData = {
        totalDebt: totalDebt.toFixed(2),
        clientsWithDebt,
        debtDetails: debtInfo.map(d => ({
            clientName: d.client.representativeName,
            patientName: d.client.patientName,
            debtAmount: d.totalDebt.toFixed(2),
            pendingInvoicesCount: d.pendingInvoices.length
        })).sort((a,b) => parseFloat(b.debtAmount) - parseFloat(a.debtAmount))
    };

    const prompt = `
        Eres un asesor financiero para una pequeña empresa. Analiza la información de deuda proporcionada y genera un informe conciso en español.

        Datos:
        ${JSON.stringify(reportData, null, 2)}

        El informe debe incluir:
        1.  **Estado General de Deudas:** Resume la deuda total pendiente y el número de clientes con pagos pendientes.
        2.  **Clientes con Mayor Deuda:** Enumera los 3-5 clientes con los saldos pendientes más grandes.
        3.  **Análisis de Riesgo:** Evalúa brevemente el impacto potencial de esta deuda en el flujo de caja del negocio.
        4.  **Recomendaciones de Cobranza:** Proporciona 2-3 recomendaciones específicas y accionables para gestionar y recuperar la deuda. Por ejemplo, sugiere enviar recordatorios amables, ofrecer planes de pago para deudas grandes o implementar políticas de pago más estrictas para nuevos servicios.

        Formatea la salida claramente usando **markdown** para los títulos y viñetas.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating debt report with Gemini:", error);
        return "Error: No se pudo generar el reporte de deudas.";
    }
};


export const generateExpenseReport = async (expenses: Expense[]): Promise<string> => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fixedExpenses = expenses.filter(e => e.type === 'Fijo').reduce((sum, exp) => sum + exp.amount, 0);
    const variableExpenses = expenses.filter(e => e.type === 'Variable').reduce((sum, exp) => sum + exp.amount, 0);

    const reportData = {
        totalExpenses: totalExpenses.toFixed(2),
        fixedExpenses: fixedExpenses.toFixed(2),
        variableExpenses: variableExpenses.toFixed(2),
        expenseCount: expenses.length,
        expensesByType: {
            Fijo: expenses.filter(e => e.type === 'Fijo').length,
            Variable: expenses.filter(e => e.type === 'Variable').length,
        },
        topExpenses: [...expenses]
            .sort((a,b) => b.amount - a.amount)
            .slice(0, 5)
            .map(e => ({ description: e.description, amount: e.amount.toFixed(2) }))
    };

    const prompt = `
        Eres un contador que analiza los gastos de una pequeña práctica de terapia. Basado en los datos proporcionados, crea un informe de gastos completo en español.

        Datos:
        ${JSON.stringify(reportData, null, 2)}

        El informe debe incluir:
        1.  **Resumen de Gastos:** Gastos totales del período, desglosados en "Gastos Fijos" y "Gastos Variables".
        2.  **Distribución de Gastos:** Muestra el porcentaje de los gastos totales que son fijos frente a variables.
        3.  **Principales Gastos:** Enumera los 5 gastos más grandes registrados.
        4.  **Análisis y Sugerencias de Ahorro:** Proporciona un breve análisis de los patrones de gasto. Ofrece 1-2 sugerencias accionables para la reducción de costos, como revisar los gastos variables o renegociar los términos de los costos fijos.

        Formatea la salida claramente usando **markdown** para los títulos y viñetas.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating expense report with Gemini:", error);
        return "Error: No se pudo generar el reporte de gastos.";
    }
};


export const generateClientReport = async (client: Client, clientInvoices: Invoice[], debtInfo: DebtInfo | null, medicalRecords: MedicalRecordEntry[]): Promise<string> => {
    const invoicesList = clientInvoices.length > 0
        ? clientInvoices.map(inv => `- ${inv.serviceName}: $${inv.price.toFixed(2)} (Pagado: $${inv.amountPaid.toFixed(2)}, Pendiente: $${inv.balance.toFixed(2)}) - ${new Date(inv.createdAt).toLocaleDateString('es-ES')}`).join('\n')
        : 'No hay facturas registradas.';
    
    let debtDetails = "El cliente está al día con sus pagos.";
    if (debtInfo && debtInfo.totalDebt > 0) {
        const debtItems = debtInfo.pendingInvoices.map(item => `- Factura de ${item.serviceName} (${new Date(item.createdAt).toLocaleDateString('es-ES')}): Saldo pendiente $${item.balance.toFixed(2)}`).join('\n');
        debtDetails = `El cliente presenta una deuda total de $${debtInfo.totalDebt.toFixed(2)}.
Detalles de facturas pendientes:
${debtItems}`;
    }

    const medicalSummary = medicalRecords.length > 0
        ? `Se han registrado ${medicalRecords.length} entradas en su historial. La entrada más reciente es del ${new Date(medicalRecords[0].date).toLocaleDateString('es-ES')}.`
        : 'No hay entradas en el historial médico.';

    const prompt = `
        Eres un asistente de negocios para un centro de terapia. Tu tarea es generar un informe profesional y conciso sobre un cliente en específico. El informe debe estar en español y ser fácil de leer para el personal administrativo.

        Aquí están los datos del cliente:
        - **Nombre del Representante:** ${client.representativeName}
        - **Nombre del Paciente:** ${client.patientName}
        - **Cédula/ID del Representante:** ${client.representativeId || 'No proporcionado'}
        - **Fecha de Nacimiento del Paciente:** ${client.patientDob || 'No proporcionada'}
        - **Cliente desde:** ${new Date(client.createdAt).toLocaleDateString('es-ES')}

        Historial de Facturación:
        ${invoicesList}

        Estado de cuenta actual:
        ${debtDetails}

        Resumen de Progreso Terapéutico:
        ${medicalSummary}

        **INSTRUCCIONES PARA EL INFORME:**
        1.  **Encabezado:** Comienza con el título "Informe Confidencial del Cliente".
        2.  **Resumen del Cliente:** Presenta la información básica del cliente de forma clara.
        3.  **Estado Financiero:** Resume el estado de cuenta actual, detallando la deuda total si existe.
        4.  **Resumen Terapéutico:** Añade un breve resumen del historial médico.
        5.  **Análisis y Recomendaciones (Sección de IA):** Basado en el historial de facturación, estado de cuenta y progreso, proporciona un breve análisis. Ofrece 1 o 2 recomendaciones accionables. Por ejemplo:
            - Si el cliente tiene deudas, recomienda un plan de pago.
            - Si el cliente es constante y paga a tiempo, sugiere un gesto de agradecimiento.
            - Si el progreso es bueno, menciona la posibilidad de discutir los siguientes pasos o terapias complementarias.
        6.  **Formato:** Utiliza títulos en negrita (con **markdown**), listas y párrafos cortos para una fácil lectura.

        Genera el informe ahora.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating client report with Gemini:", error);
        return "Error: No se pudo generar el informe del cliente. Verifique la conexión o la configuración de la API.";
    }
};


const getPartFromDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) return null;
    return {
        inlineData: {
            mimeType: match[1],
            data: match[2],
        }
    };
};

export const generateMedicalReport = async (data: MedicalReportData): Promise<string> => {
    const { client, medicalRecords, invoices, customInstructions } = data;

    const parts: any[] = [];
    const imageReferences: string[] = [];
    let imageCounter = 1;

    const medicalHistoryFormatted = medicalRecords.map(r => {
        let entryText = ` - Fecha: ${new Date(r.date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
   - Actividad: ${r.activityDescription}
   - Hitos: ${r.expectedMilestones}
   - Resultado: ${r.achievementStatus}
   - Notas: ${r.therapistNotes || 'N/A'}`;

        if (r.image) {
            const imagePart = getPartFromDataUrl(r.image);
            if (imagePart) {
                parts.push(imagePart);
                const reference = `[IMAGEN ${imageCounter}]`;
                entryText += `\n   - Anexo: ${reference}`;
                imageReferences.push(reference);
                imageCounter++;
            }
        }
        return entryText;
    }).join('\n\n');

    const invoicesFormatted = invoices.map(i =>
        ` - Servicio: ${i.serviceName} por $${i.price.toFixed(2)} (${new Date(i.createdAt).toLocaleDateString('es-ES')})`
    ).join('\n');

     const imageInstruction = imageReferences.length > 0
        ? `Se han adjuntado ${imageReferences.length} imagen(es) a este informe, referenciadas como ${imageReferences.join(', ')}. Por favor, analiza estas imágenes como parte del progreso del paciente (ej. posturas, trabajos manuales, expresiones) y considera tus observaciones en el informe final.`
        : '';

    const prompt = `
        Actúa como un terapeuta clínico altamente experimentado. Tu tarea es redactar un informe médico profesional y detallado en español para el paciente, basándote en la información proporcionada. El informe debe ser estructurado, claro y utilizar terminología clínica apropiada pero comprensible.

        **Datos del Paciente:**
        - Nombre del Paciente: ${client.patientName}
        - Fecha de Nacimiento: ${client.patientDob || 'No proporcionada'}
        - Nombre del Representante: ${client.representativeName}
        - Cliente desde: ${new Date(client.createdAt).toLocaleDateString('es-ES')}

        **Historial de Sesiones Clínicas:**
        ${medicalHistoryFormatted || 'No hay registros clínicos detallados.'}
        
        **Análisis de Imágenes Adjuntas:**
        ${imageInstruction}

        **Historial de Servicios/Terapias Facturadas:**
        ${invoicesFormatted || 'No hay servicios facturados.'}

        **Instrucciones Adicionales del Terapeuta para este Informe:**
        "${customInstructions || 'No hay instrucciones adicionales.'}"

        **INSTRUCCIONES DE GENERACIÓN:**
        1.  **Formato Profesional:** Estructura el informe con las siguientes secciones obligatorias, usando **markdown** para los títulos:
            - **INFORME DE PROGRESO CLÍNICO**
            - **1. Datos del Paciente**
            - **2. Resumen del Historial Terapéutico** (Resume las actividades y progresos basados en el historial de sesiones).
            - **3. Análisis de Hitos y Objetivos** (Analiza los hitos logrados, en progreso o no logrados, y cómo se relacionan con los objetivos terapéuticos).
            - **4. Observaciones del Terapeuta (incluyendo análisis de imágenes si aplica)** (Basándote en las notas Y LAS IMÁGENES, describe patrones, fortalezas o áreas de mejora).
            - **5. Conclusiones y Recomendaciones** (Ofrece una conclusión general del período evaluado y sugiere los próximos pasos o áreas de enfoque).
        2.  **Tono y Lenguaje:** Utiliza un tono profesional, objetivo y empático.
        3.  **Integración de Datos:** Sintetiza la información de todas las fuentes (datos del paciente, historial, notas, IMÁGENES) para crear un análisis coherente.
        4.  **Instrucciones del Usuario:** Presta especial atención a las "Instrucciones Adicionales del Terapeuta" y asegúrate de que el informe refleje esas directrices. Por ejemplo, si se pide enfocarse en un aspecto motor, dale prioridad en el análisis.
        5.  **Confidencialidad:** Finaliza el informe con una nota de confidencialidad estándar.

        Genera el informe ahora.
    `;
    
    parts.unshift({ text: prompt });

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating medical report with Gemini:", error);
        return "Error: No se pudo generar el informe médico. Por favor, intente de nuevo más tarde.";
    }
};