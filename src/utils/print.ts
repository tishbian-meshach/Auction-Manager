import dayjs from 'dayjs';
import type { Auction } from '../api';

export function printBill(auction: Auction): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');

    if (!printWindow) {
        alert('Please allow popups to print the bill');
        return;
    }

    const formatCurrency = (amount: string | number): string => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const itemsRows = auction.items.map((item, index) => {
        const itemTotal = item.quantity * parseFloat(String(item.price));
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
        <h1>AUCTION BILL</h1>
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
        <p>Thank you for your business!</p>
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
