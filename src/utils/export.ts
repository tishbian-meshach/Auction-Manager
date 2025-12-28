import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { Auction } from '../api';
import { isNative } from './platform';

interface ExportFilters {
    filterType: 'all' | 'month' | 'date';
    paymentFilter: 'all' | 'paid' | 'unpaid';
    selectedMonth?: dayjs.Dayjs;
    selectedDate?: dayjs.Dayjs;
    searchQuery?: string;
}

function getFilterDescription(filters: ExportFilters): string {
    const parts: string[] = [];

    if (filters.filterType === 'month' && filters.selectedMonth) {
        parts.push(`Month: ${filters.selectedMonth.format('MMMM YYYY')}`);
    } else if (filters.filterType === 'date' && filters.selectedDate) {
        parts.push(`Date: ${filters.selectedDate.format('DD MMM YYYY')}`);
    } else {
        parts.push('Time Period: All Time');
    }

    if (filters.paymentFilter === 'paid') {
        parts.push('Status: Paid Only');
    } else if (filters.paymentFilter === 'unpaid') {
        parts.push('Status: Unpaid Only');
    } else {
        parts.push('Status: All');
    }

    if (filters.searchQuery) {
        parts.push(`Search: "${filters.searchQuery}"`);
    }

    return parts.join(' | ');
}

// Format currency with rupee symbol for Excel (handles Unicode)
function formatCurrencyFull(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(num);
}

// Format number with Indian comma system for PDF (no rupee symbol - PDF doesn't handle it well)
function formatNumberINR(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

// Share file on native platforms
async function shareFile(filePath: string, filename: string): Promise<void> {
    try {
        await Share.share({
            title: filename,
            url: filePath,
            dialogTitle: `Share ${filename}`,
        });
    } catch (error) {
        console.error('Error sharing file:', error);
        throw error;
    }
}

// Save and share PDF on native
async function savePDFNative(doc: jsPDF, filename: string): Promise<void> {
    const pdfOutput = doc.output('datauristring');
    const base64Data = pdfOutput.split(',')[1];

    const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
    });

    await shareFile(result.uri, filename);
}

// Save and share Excel on native
async function saveExcelNative(data: ArrayBuffer, filename: string): Promise<void> {
    const base64Data = btoa(
        new Uint8Array(data).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
    });

    await shareFile(result.uri, filename);
}

export async function exportToPDF(auctions: Auction[], filters: ExportFilters): Promise<void> {
    const doc = new jsPDF();
    const filterText = getFilterDescription(filters);
    const exportDate = dayjs().format('DD MMM YYYY, hh:mm A');

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Auction Report', 14, 20);

    // Filters applied
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Filters: ${filterText}`, 14, 28);
    doc.text(`Exported on: ${exportDate}`, 14, 34);
    doc.text(`Total Records: ${auctions.length}`, 14, 40);

    // Calculate totals
    const totalAmount = auctions.reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);
    const paidAmount = auctions.filter(a => a.isPaid).reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);
    const unpaidAmount = auctions.filter(a => !a.isPaid).reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);

    doc.text(`Total: Rs.${formatNumberINR(totalAmount)} | Paid: Rs.${formatNumberINR(paidAmount)} | Unpaid: Rs.${formatNumberINR(unpaidAmount)}`, 14, 46);

    // Table data - using plain number format
    const tableData = auctions.map((auction, index) => [
        (index + 1).toString(),
        auction.personName,
        auction.mobileNumber,
        dayjs(auction.auctionDate).format('DD MMM YYYY'),
        auction.items.length.toString(),
        `Rs.${formatNumberINR(auction.totalAmount)}`,
        auction.isPaid ? 'Paid' : 'Not Paid',
    ]);

    autoTable(doc, {
        head: [['#', 'Person Name', 'Mobile', 'Date', 'Items', 'Amount (Rs.)', 'Status']],
        body: tableData,
        startY: 52,
        styles: {
            fontSize: 9,
            cellPadding: 3,
            font: 'helvetica',
        },
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold',
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 38 },
            2: { cellWidth: 28 },
            3: { cellWidth: 28 },
            4: { cellWidth: 15, halign: 'center' },
            5: { cellWidth: 32, halign: 'right' },
            6: { cellWidth: 22, halign: 'center' },
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250],
        },
    });

    // Save
    const filename = `auctions_${dayjs().format('YYYY-MM-DD_HHmm')}.pdf`;

    if (isNative()) {
        await savePDFNative(doc, filename);
    } else {
        doc.save(filename);
    }
}

export async function exportToExcel(auctions: Auction[], filters: ExportFilters): Promise<void> {
    const filterText = getFilterDescription(filters);
    const exportDate = dayjs().format('DD MMM YYYY, hh:mm A');

    // Calculate totals
    const totalAmount = auctions.reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);
    const paidAmount = auctions.filter(a => a.isPaid).reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);
    const unpaidAmount = auctions.filter(a => !a.isPaid).reduce((sum, a) => sum + parseFloat(a.totalAmount), 0);

    // Header rows
    const headerRows = [
        ['AUCTION REPORT'],
        [],
        ['Filters Applied:', filterText],
        ['Exported On:', exportDate],
        ['Total Records:', auctions.length.toString()],
        ['Total Amount:', formatCurrencyFull(totalAmount), 'Paid:', formatCurrencyFull(paidAmount), 'Unpaid:', formatCurrencyFull(unpaidAmount)],
        [],
        ['#', 'Person Name', 'Mobile Number', 'Auction Date', 'Items Count', 'Total Amount', 'Payment Status'],
    ];

    // Data rows
    const dataRows = auctions.map((auction, index) => [
        index + 1,
        auction.personName,
        auction.mobileNumber,
        dayjs(auction.auctionDate).format('DD MMM YYYY'),
        auction.items.length,
        parseFloat(auction.totalAmount),
        auction.isPaid ? 'Paid' : 'Not Paid',
    ]);

    // Items detail sheet
    const itemsData = [
        ['AUCTION ITEMS DETAIL'],
        [],
        ['Auction ID', 'Person Name', 'Item Name', 'Quantity', 'Price', 'Item Total'],
    ];

    auctions.forEach((auction) => {
        auction.items.forEach((item) => {
            itemsData.push([
                auction.id.slice(0, 8),
                auction.personName,
                item.itemName,
                item.quantity.toString(),
                item.price.toString(),
                item.price.toString(),
            ]);
        });
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summarySheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows]);

    // Set column widths
    summarySheet['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(wb, summarySheet, 'Auctions');

    // Items detail sheet
    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    itemsSheet['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 25 },
        { wch: 10 },
        { wch: 12 },
        { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items Detail');

    // Generate and save
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const filename = `auctions_${dayjs().format('YYYY-MM-DD_HHmm')}.xlsx`;

    if (isNative()) {
        await saveExcelNative(wbout, filename);
    } else {
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, filename);
    }
}
