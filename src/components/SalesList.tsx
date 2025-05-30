import { useState } from 'react';
import { Search, } from "lucide-react";


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
  status: string;
  paymentMethod: string;
  updatedBy: string;
  updatedAt: string;
};

type Props = {
  saleData: SaleData[];
};

const SalesList = ({ saleData }: Props) => {
  const [searchTerm, setSearchTerm] = useState('');


  const filteredData = saleData
    .filter((sale) => sale.status === 'Charge')
    .filter((sale) =>
      Object.values(sale).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  console.log("filteredData:;;;;;", filteredData)

  return (
    <div className="bg-card rounded-lg shadow pt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-8 px-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Recent Sale ({filteredData.length} showing)
        </h2>
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-2">Consultant</th>
              <th className="px-4 py-2">Passenger</th>
              <th className="px-4 py-2">Ticket Type</th>
              <th className="px-4 py-2">Confirmation</th>
              <th className="px-4 py-2">Sale / MCO</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Updated By</th>
              <th className="px-4 py-2">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((sale, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">{sale.consultant}</td>
                <td className="px-4 py-2">
                  <div>{sale.passengerName}</div>
                  <div className="text-muted-foreground text-xs">{sale.passengerEmail}</div>
                </td>
                <td className="px-4 py-2">
                  {sale.ticketType}
                  <div className="text-xs text-muted-foreground">{sale.requestFor}</div>

                </td>
                <td className="px-4 py-2">{sale.confirmationCode}</td>
                <td className="px-4 py-2">
                  {/* <div className="text-xs text-muted-foreground">TicketCost: ${sale.ticketCostUSD.toFixed(2)}</div> */}
                  <div className="text-xs text-muted-foreground">MCO: ${sale.mcoUSD.toFixed(2)}</div>
                  <div className="font-medium text-green-600">Sale: ${sale.saleAmount.toFixed(2)}</div>

                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${sale.status === 'Charge'
                      ? 'bg-green-100 text-green-800'
                      : sale.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {sale.status}
                  </span>
                </td>
                <td className="px-4 py-2">{sale.paymentMethod}</td>
                <td className="px-4 py-2">{sale.updatedBy}</td>
                <td className="px-4 py-2">{new Date(sale.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesList;
