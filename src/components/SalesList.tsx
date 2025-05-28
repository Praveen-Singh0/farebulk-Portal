import { SALES_DATA } from '../constants/auth';

const SalesList = () => {
  return (
    <div className="bg-card rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Sales Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Sale By</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Passenger</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Airline</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Confirmation</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {SALES_DATA.map((sale, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="px-6 py-4 text-sm">{sale.consultant}</td>
                  <td className="px-6 py-4 text-sm">{sale.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium">{sale.passengerName}</div>
                      <div className="text-muted-foreground">{sale.passengerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{sale.airlinesName}</td>
                  <td className="px-6 py-4 text-sm">{sale.confirmationCode}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium">${sale.ticketCostUSD.toFixed(2)}</div>
                      <div className="text-muted-foreground">MCO: ${sale.mcoUSD.toFixed(2)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesList; 