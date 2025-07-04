import axios from 'axios';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Tooltip, Cell, Legend, ResponsiveContainer } from 'recharts';
import SalesList from './SalesList';
import dayjs from 'dayjs';


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];


type TicketRequestStatus = {
  ticketRequest: {
    consultant: string;
    passengerName: string;
    passengerEmail: string;
    ticketType: string;
    requestFor:string;
    confirmationCode: string;
    ticketCost: string;
    mco: string;
  };
  createdAt: string;
  status: string;
  paymentMethod: string;
  updatedBy: string;
  updatedAt: string;
};

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

type ConsultantSale = {
  name: string;
  sales: number;
};

const SalesOverview = () => {
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [consultantSales, setConsultantSales] = useState<ConsultantSale[]>([]);
  const [totalSales, setTotalSales] = useState<number>(0);

useEffect(() => {
  const fetchSalesData = async () => {
    try {
      const response = await axios.get<{ data: TicketRequestStatus[] }>(
        `${import.meta.env.VITE_BASE_URL}/ticket-requests-status`,
        { withCredentials: true }
      );

      // Filter only current month's data first
      const currentYear = dayjs().year();
      const currentMonth = dayjs().month(); // 0-indexed

      const filteredData = response.data.data.filter((item) => {
        const itemDate = dayjs(item.createdAt);
        return itemDate.year() === currentYear && itemDate.month() === currentMonth;
      });

      // Process only filtered data
      const processed: SaleData[] = filteredData.map((item) => {
        const mco = parseFloat(item.ticketRequest.mco);
        const saleAmount = mco * 0.85;
        return {
          consultant: item.ticketRequest.consultant,
          passengerName: item.ticketRequest.passengerName,
          passengerEmail: item.ticketRequest.passengerEmail,
          ticketType: item.ticketRequest.ticketType,
          confirmationCode: item.ticketRequest.confirmationCode,
          ticketCostUSD: parseFloat(item.ticketRequest.ticketCost),
          requestFor: item.ticketRequest.requestFor,
          mcoUSD: mco,
          saleAmount,
          status: item.status,
          paymentMethod: item.paymentMethod,
          updatedBy: item.updatedBy,
          updatedAt: item.updatedAt,
        };
      });

      setSalesData(processed);

      // Total only for "Charge" status
      const total = processed.reduce((sum, item) => {
        if (item.status === "Charge") {
          return sum + item.saleAmount;
        }
        return sum;
      }, 0);
      setTotalSales(total);

      // Consultant-wise sales
      const consultantMap: Record<string, number> = {};
      processed
        .filter((item) => item.status === "Charge")
        .forEach((item) => {
          consultantMap[item.consultant] = (consultantMap[item.consultant] || 0) + item.saleAmount;
        });

      const consultantArray = Object.entries(consultantMap).map(([name, sales]) => ({
        name,
        sales,
      }));

      setConsultantSales(consultantArray);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  fetchSalesData();
}, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.filter(item => item.status === "Charge").length}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultant Sales Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={consultantSales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="sales"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {consultantSales.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <SalesList saleData={salesData} />
    </div>
  );
};

export default SalesOverview;
