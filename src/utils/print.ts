import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { Auction } from '../api';
import { isNative } from './platform';

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

// Format number for PDF (Rs. prefix, no rupee symbol)
const formatNumberINR = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs.${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

// Generate PDF bill
function generateBillPDF(auction: Auction): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt-style format
  });

  const pageWidth = 80;
  const margin = 5;
  let y = 10;

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("ST.JOHN'S CHURCH", pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('AUCTION BILL', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Invoice / Bill of Sale', pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Customer Info
  doc.setFontSize(9);
  doc.text(`Customer: ${auction.personName}`, margin, y);
  y += 5;
  doc.text(`Mobile: ${auction.mobileNumber}`, margin, y);
  y += 5;
  doc.text(`Date: ${dayjs(auction.auctionDate).format('DD MMM YYYY')}`, margin, y);
  y += 5;
  doc.text(`Status: ${auction.isPaid ? 'PAID' : 'UNPAID'}`, margin, y);
  y += 8;

  // Items table
  const tableData = auction.items.map((item, index) => [
    (index + 1).toString(),
    item.itemName.substring(0, 15),
    item.quantity.toString(),
    formatNumberINR(item.price),
    formatNumberINR(parseFloat(String(item.price))),
  ]);

  autoTable(doc, {
    head: [['#', 'Item', 'Qty', 'Price', 'Total']],
    body: tableData,
    startY: y,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },
      1: { cellWidth: 25 },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 15, halign: 'right' },
    },
  });

  // Get final Y position after table
  y = (doc as any).lastAutoTable.finalY + 5;

  // Total
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, y);
  doc.text(formatNumberINR(auction.totalAmount), pageWidth - margin, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('May God Bless You!', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, pageWidth / 2, y, { align: 'center' });

  return doc;
}

// Share PDF on native
async function sharePDFNative(doc: jsPDF, filename: string): Promise<void> {
  const pdfOutput = doc.output('datauristring');
  const base64Data = pdfOutput.split(',')[1];

  const result = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory: Directory.Cache,
  });

  await Share.share({
    title: filename,
    url: result.uri,
    dialogTitle: 'Share Bill',
  });
}

// Print bill using popup window (web) or PDF share (native)
export async function printBill(auction: Auction): Promise<void> {
  if (isNative()) {
    // On native platform, generate PDF and share
    const doc = generateBillPDF(auction);
    const filename = `bill_${auction.personName.replace(/\s+/g, '_')}_${dayjs().format('YYYYMMDD_HHmm')}.pdf`;
    await sharePDFNative(doc, filename);
  } else {
    // On web, use popup window (existing behavior)
    printBillWeb(auction);
  }
}

// Original web-based print function
function printBillWeb(auction: Auction): void {
  const printWindow = window.open('', '_blank', 'width=400,height=600');

  if (!printWindow) {
    alert('Please allow popups to print the bill');
    return;
  }

  const itemsRows = auction.items.map((item, index) => {
    const itemTotal = parseFloat(String(item.price));
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  }).join('');

  const billHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${auction.personName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 20px;
          max-width: 400px;
          margin: 0 auto;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 15px;
        }
        .header h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          color: #666;
        }
        .info {
          margin-bottom: 15px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 5px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 13px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          color: #666;
        }
        .info-value {
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12px;
        }
        th {
          background: #333;
          color: white;
          padding: 10px 8px;
          text-align: left;
        }
        th:nth-child(3), th:nth-child(4), th:nth-child(5) {
          text-align: right;
        }
        .total-section {
          border-top: 2px solid #333;
          padding-top: 10px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.grand-total {
          font-size: 18px;
          font-weight: bold;
          background: #f0f0f0;
          margin: 0 -20px;
          padding: 12px 20px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-paid {
          background: #dcfce7;
          color: #166534;
        }
        .status-unpaid {
          background: #fee2e2;
          color: #dc2626;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #ccc;
          font-size: 11px;
          color: #666;
        }
        @media print {
          body {
            padding: 10px;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>ST.JOHN'S CHURCH</h1>
        <p>AUCTION BILL</p>
        <p>Invoice / Bill of Sale</p>
      </div>

      <div class="info">
        <div class="info-row">
          <span class="info-label">Customer:</span>
          <span class="info-value">${auction.personName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Mobile:</span>
          <span class="info-value">${auction.mobileNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Date:</span>
          <span class="info-value">${dayjs(auction.auctionDate).format('DD MMM YYYY')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="status-badge ${auction.isPaid ? 'status-paid' : 'status-unpaid'}">
            ${auction.isPaid ? 'PAID' : 'UNPAID'}
          </span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Items Count:</span>
          <span>${auction.items.length}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL AMOUNT:</span>
          <span>${formatCurrency(auction.totalAmount)}</span>
        </div>
      </div>

      <div class="footer">
        <p>May God Bless You!</p>
        <p style="margin-top: 5px;">Generated on ${dayjs().format('DD MMM YYYY, hh:mm A')}</p>
      </div>

      <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="
          padding: 12px 30px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
        ">
          Print Bill
        </button>
        <button onclick="window.close()" style="
          padding: 12px 30px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          margin-left: 10px;
        ">
          Close
        </button>
      </div>

      <script>
        // Auto-trigger print dialog after a short delay
        setTimeout(() => {
          window.print();
        }, 500);
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(billHTML);
  printWindow.document.close();
}
