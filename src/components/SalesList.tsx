import { useState } from 'react';
import { Search, FileText, FileSpreadsheet } from "lucide-react";

type SaleData = {
  consultant: string;
  passengerName: string;
  passengerEmail: string;
  ticketType: string;
  confirmationCode: string;
  ticketCostUSD: number;
  requestFor: string;
  mcoUSD: number;
  saleAmount: number;
  airlineCode: string;
  status: string;
  paymentMethod: string;
  updatedBy: string;
  updatedAt: string;
};

type Props = {
  saleData: SaleData[];
};

const SalesList = ({ saleData = [] }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');

  console.log("sale data", saleData)

  const filteredData = saleData
    .filter((sale) => sale.status === 'Charge')
    .filter((sale) =>
      Object.values(sale).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const formatDate = (dateString: string): string => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  const downloadExcel = () => {
    const headers = [
      'Consultant',
      'Passenger Name',
      'Passenger Email',
      'Ticket Type',
      'Request For',
      'Confirmation Code',
      'Ticket Cost (USD)',
      'MCO (USD)',
      'Sale Amount',
      'Status',
      'Payment Method',
      'Updated By',
      'Updated At'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(sale => [
        `"${sale.consultant}"`,
        `"${sale.passengerName}"`,
        `"${sale.passengerEmail}"`,
        `"${sale.ticketType}"`,
        `"${sale.requestFor}"`,
        `"${sale.confirmationCode}"`,
        sale.ticketCostUSD,
        sale.mcoUSD,
        sale.saleAmount,
        `"${sale.status}"`,
        `"${sale.paymentMethod}"`,
        `"${sale.updatedBy}"`,
        `"${formatDate(sale.updatedAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 20px;
          }
          .report-info {
            text-align: center;
            margin-bottom: 20px;
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
            font-size: 10px;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          tr:nth-child(even) { 
            background-color: #f9f9f9; 
          }
          .status-charge {
            background-color: #d4edda;
            color: #155724;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
          }
          .amount {
            font-weight: bold;
            color: #28a745;
          }
          @media print {
            body { margin: 0; }
            @page { size: landscape; margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <div class="report-info">
          <p>Generated on: ${new Date().toLocaleDateString()} | Total Records: ${filteredData.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Consultant</th>
              <th>Passenger</th>
              <th>Email</th>
              <th>Ticket Type</th>
              <th>Request For</th>
              <th>Confirmation</th>
              <th>MCO ($)</th>
              <th>Sale Amount ($)</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Updated By</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map(sale => `
              <tr>
                <td>${sale.consultant}</td>
                <td>${sale.passengerName}</td>
                <td>${sale.passengerEmail}</td>
                <td>${sale.ticketType} ${sale.airlineCode ? sale.airlineCode : ''}</td>
                <td>${sale.requestFor}</td>
                <td>${sale.confirmationCode}</td>
                <td>$${sale.mcoUSD.toFixed(2)}</td>
                <td class="amount">$${sale.saleAmount.toFixed(2)}</td>
                <td><span class="status-charge">${sale.status}</span></td>
                <td>${sale.paymentMethod}</td>
                <td>${sale.updatedBy}</td>
                <td>${formatDate(sale.updatedAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };


  const finalFilteredData = saleData
    .filter((sale) => sale.status === 'Charge')
    .filter((sale) =>
      Object.values(sale).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  return (
    <div className="bg-white rounded-lg shadow pt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-8 px-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Recent Sales ({finalFilteredData.length} showing)
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={downloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              title="Download as PDF"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={downloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              title="Download as Excel/CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-900">Consultant</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Passenger</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Ticket Type</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Confirmation</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Sale / MCO</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Payment</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Updated By</th>
              <th className="px-4 py-3 font-semibold text-gray-900">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {finalFilteredData.map((sale, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{sale.consultant}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{sale.passengerName}</div>
                  <div className="text-gray-500 text-xs">{sale.passengerEmail}</div>
                </td>
                <td className="px-4 py-3">

                  <div className="font-medium text-gray-900"> {sale.ticketType || "N/A"}
                    {sale.airlineCode ? ` - ${sale.airlineCode}` : ""}
                  </div>
                  <div className="text-xs text-gray-500">{sale.requestFor}</div>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{sale.confirmationCode}</td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500">MCO: ${sale.mcoUSD.toFixed(2)}</div>
                  <div className="font-semibold text-green-600">Sale: ${sale.saleAmount.toFixed(2)}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'Charge'
                      ? 'bg-green-100 text-green-800'
                      : sale.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="px-4 py-3">{sale.paymentMethod}</td>
                <td className="px-4 py-3">{sale.updatedBy}</td>
                <td className="px-4 py-3 text-sm">{formatDate(sale.updatedAt)}</td>
              </tr>
            ))}
            {finalFilteredData.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No sales data found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Final MCO: ${finalFilteredData.reduce((sum, sale) => sum + sale.saleAmount, 0).toFixed(2)}</span>
          <span>Total MCO: ${finalFilteredData.reduce((sum, sale) => sum + sale.mcoUSD, 0).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default SalesList;