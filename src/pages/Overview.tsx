import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/use-auth';

import axios from 'axios';

// Define types
interface SaleData {
  id: number;
  client: string;
  destination: string;
  amount: number;
  date: string;
  status: string;
}

interface TicketRequest {
  _id?: string;
  consultant?: string;
  passengerName?: string;
  passengerEmail?: string;
  ticketType?: string;
  requestFor?: string;
  confirmationCode?: string;
  status?: string;
  ticketCost: string;
  mco: string;
  createdAt: string;
}

interface SalesDataItem {
  _id: string;
  status: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  ticketRequest?: TicketRequest;
}

interface ChartData {
  month?: string;
  day?: string;
  week?: string;
  sales: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
}

interface ProcessedMetrics {
  totalSales: number;
  totalMCO: number;
  totalBookings: number;
  averageTicketCost: number;
  paymentMethods: PaymentMethodData[];
  monthlySales: ChartData[];
  chargedSales: SalesDataItem[];
}

interface ChartConfig {
  data: ChartData[];
  dataKey: string;
  fill: string;
}

// Travel consultant dummy data (keeping for non-admin roles)
const myPersonalSales: SaleData[] = [
  { id: 1, client: 'John Smith', destination: 'Dubai', amount: 0, date: '2025-05-25', status: 'Confirmed' },
  { id: 2, client: 'Sarah Johnson', destination: 'London', amount: 0, date: '2025-05-24', status: 'Pending' },
  { id: 3, client: 'Mike Brown', destination: 'Tokyo', amount: 0, date: '2025-05-23', status: 'Confirmed' },
  { id: 4, client: 'Emma Davis', destination: 'Paris', amount: 0, date: '2025-05-22', status: 'Confirmed' },
  { id: 5, client: 'David Wilson', destination: 'New York', amount: 0, date: '2025-05-21', status: 'Cancelled' },
];


const travelConsultantData = {
  monthlySales: [
    { month: 'May 2024', sales: 2800 },
    { month: 'Jun 2024', sales: 3200 },
    { month: 'Jul 2024', sales: 2900 },
    { month: 'Aug 2024', sales: 3400 },
    { month: 'Sep 2024', sales: 2600 },
    { month: 'Oct 2024', sales: 3800 },
    { month: 'Nov 2024', sales: 3100 },
    { month: 'Dec 2024', sales: 3500 },
    { month: 'Jan 2025', sales: 2900 },
    { month: 'Feb 2025', sales: 3600 },
    { month: 'Mar 2025', sales: 3200 },
    { month: 'Apr 2025', sales: 3400 },
    { month: 'May 2025', sales: 1200 },
  ],
  weeklySales: [
    { week: 'Week 1', sales: 800 },
    { week: 'Week 2', sales: 950 },
    { week: 'Week 3', sales: 750 },
    { week: 'Week 4', sales: 1100 },
  ],
  dailySales: [
    { day: 'Mon', sales: 320 },
    { day: 'Tue', sales: 280 },
    { day: 'Wed', sales: 450 },
    { day: 'Thu', sales: 380 },
    { day: 'Fri', sales: 290 },
    { day: 'Sat', sales: 150 },
    { day: 'Sun', sales: 90 },
  ],
  bookingStats: [
    { name: 'Completed', value: 85, color: '#10B981' },
    { name: 'Pending', value: 12, color: '#F59E0B' },
    { name: 'Cancelled', value: 3, color: '#EF4444' },
  ],
  clientTypeData: [
    { name: 'Corporate', value: 60 },
    { name: 'Leisure', value: 35 },
    { name: 'Group', value: 5 },
  ],
  performanceMetrics: [
    { month: 'Jan', bookings: 15, revenue: 2900, target: 3000 },
    { month: 'Feb', bookings: 18, revenue: 3600, target: 3200 },
    { month: 'Mar', bookings: 16, revenue: 3200, target: 3100 },
    { month: 'Apr', bookings: 17, revenue: 3400, target: 3300 },
    { month: 'May', bookings: 6, revenue: 1200, target: 3500 },
  ]
};

// Card color configurations
const cardColors = [
  { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', text: 'text-white' },
];

// Pie chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Overview: React.FC = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [salesData, setSalesData] = useState<SalesDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketRequests, setTicketRequests] = useState<TicketRequest[]>([]);

  const isAdmin = user?.role === 'admin';
  const isTravelConsultant = user?.role === 'travel';
  const isTicketConsultant = user?.role === 'ticket';

  // Fetch sales data from API
  useEffect(() => {
    const fetchSalesData = async (): Promise<void> => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/ticket-requests-status`, {
          withCredentials: true
        });

        if (response.data.success) {
          setSalesData(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sales data:', err);
        setError('Failed to fetch sales data');
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  // Helper functions for calculations
  const calculateDeduction = (mco?: string): number => {
    const mcoAmount = parseFloat(mco || '0') || 0;
    return mcoAmount * 0.15;
  };

  const calculateSale = (mco?: string): number => {
    const mcoAmount = parseFloat(mco || '0') || 0;
    const deduction = calculateDeduction(mco);
    return mcoAmount - deduction;
  };

  // Process sales data for dashboard metrics
  const processedData = (): ProcessedMetrics | null => {
    if (!salesData.length) return null;

    // Filter only "Charge" status entries
    const chargedSales = salesData.filter(item => item.status === 'Charge');

    // Calculate totals
    const totalSales = chargedSales.reduce((sum, item) => {
      const saleAmount = calculateSale(item.ticketRequest?.mco);
      return sum + saleAmount;
    }, 0);

    const totalMCO = chargedSales.reduce((sum, item) => {
      const mcoAmount = parseFloat(item.ticketRequest?.mco || '0') || 0;
      return sum + mcoAmount;
    }, 0);

    const totalBookings = chargedSales.length;
    const averageTicketCost = totalBookings > 0 ? totalSales / totalBookings : 0;

    // Payment method distribution
    const paymentMethodCounts: Record<string, number> = {};
    chargedSales.forEach(item => {
      const method = item.paymentMethod || 'Unknown';
      paymentMethodCounts[method] = (paymentMethodCounts[method] || 0) + 1;
    });

    const paymentMethods = Object.entries(paymentMethodCounts).map(([name, count]) => ({
      name,
      value: Math.round((count / chargedSales.length) * 100)
    }));

    // Generate monthly sales data based on createdAt dates
    const monthlySales: Record<string, number> = {};
    chargedSales.forEach(item => {
      const date = new Date(item.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const saleAmount = calculateSale(item.ticketRequest?.mco);
      monthlySales[monthKey] = (monthlySales[monthKey] || 0) + saleAmount;
    });

    const monthlySalesArray = Object.entries(monthlySales).map(([month, sales]) => ({
      month,
      sales: Math.round(sales)
    })).slice(-12); // Last 12 months

    return {
      totalSales,
      totalMCO,
      totalBookings,
      averageTicketCost,
      paymentMethods,
      monthlySales: monthlySalesArray,
      chargedSales
    };
  };

  const metrics = processedData();

  // Generate chart data based on timeframe
  const getChartData = (): ChartConfig => {
    if (!metrics) return { data: [], dataKey: 'month', fill: '#8884d8' };

    switch (timeFrame) {
      case 'daily':
        // Generate last 7 days data
        const dailyData: ChartData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayKey = date.toISOString().split('T')[0];

          const daySales = metrics.chargedSales
            .filter(item => item.createdAt.split('T')[0] === dayKey)
            .reduce((sum, item) => sum + calculateSale(item.ticketRequest?.mco), 0);

          dailyData.push({ day: dayName, sales: Math.round(daySales) });
        }
        return { data: dailyData, dataKey: 'day', fill: '#8884d8' };

      case 'weekly':
        // Generate last 4 weeks data
        const weeklyData: ChartData[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          const weekSales = metrics.chargedSales
            .filter(item => {
              const itemDate = new Date(item.createdAt);
              return itemDate >= weekStart && itemDate <= weekEnd;
            })
            .reduce((sum, item) => sum + calculateSale(item.ticketRequest?.mco), 0);

          weeklyData.push({ week: `Week ${4 - i}`, sales: Math.round(weekSales) });
        }
        return { data: weeklyData, dataKey: 'week', fill: '#82ca9d' };

      case 'monthly':
      default:
        return { data: metrics.monthlySales, dataKey: 'month', fill: '#8884d8' };
    }
  };

  const chartConfig = getChartData();

  // Recent Sales Component
  const RecentSales: React.FC = () => {
    if (!salesData || salesData.length === 0) {
      return (
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Recent Sales Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div role="status" className="inline-flex items-center justify-center">
                <svg
                  aria-hidden="true"
                  className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"
                  />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    const recentSales = salesData.slice(0, 5); // Show only 5 rows

    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Recent Sales Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Consultant</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ticket Info</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Confirmation</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Sale/MCO</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Payment Method</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Processed By</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Updated At</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((item) => (
                  <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.ticketRequest?.consultant || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.ticketRequest?.passengerName || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{item.ticketRequest?.passengerEmail || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.ticketRequest?.ticketType || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{item.ticketRequest?.requestFor || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {item.ticketRequest?.confirmationCode || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        {item.status === 'Charge' && (
                          <div className="font-medium text-green-600">
                            ${calculateSale(item.ticketRequest?.mco).toFixed(2)}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          MCO: ${item.ticketRequest?.mco || '0.00'}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Charge' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-900">{item.paymentMethod || 'N/A'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-900">{item.updatedBy || 'N/A'}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  };


  useEffect(() => {
    if (!isTicketConsultant) return;
    const fetchTicketRequests = async () => {
      try {
        setLoading(true)
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/ticket-requests`, {
          withCredentials: true
        });

        // Filter tickets based on user email and status
        const userTickets = response.data.filter((ticket: TicketRequest) => {
          // First filter by user access
          let hasAccess = false;
          if (user.role === 'ticket') {
            hasAccess = true;
          } else {
            hasAccess = ticket.passengerEmail === user.email ||
              ticket.consultant === user.userName ||
              ticket.consultant === user.email;
          }

          return hasAccess && ticket.status === 'Pending';
        });
        setTicketRequests(userTickets.slice(0, 5));

      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketRequests();
  }, [isTicketConsultant]);


  // Admin Dashboard
  if (isAdmin) {
    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      );
    }

    // Handle case when no data but still show UI with $0.00 for cards and empty charts
    const displayMetrics: ProcessedMetrics = metrics || {
      totalSales: 0,
      totalMCO: 0,
      totalBookings: 0,
      averageTicketCost: 0,
      paymentMethods: [],
      monthlySales: [],
      chargedSales: []
    };

    // Generate empty chart data when no metrics
    const getEmptyChartData = (): ChartConfig => {
      switch (timeFrame) {
        case 'daily':
          const emptyDailyData: ChartData[] = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            emptyDailyData.push({ day: dayName, sales: 0 });
          }
          return { data: emptyDailyData, dataKey: 'day', fill: '#8884d8' };

        case 'weekly':
          const emptyWeeklyData: ChartData[] = [];
          for (let i = 3; i >= 0; i--) {
            emptyWeeklyData.push({ week: `Week ${4 - i}`, sales: 0 });
          }
          return { data: emptyWeeklyData, dataKey: 'week', fill: '#82ca9d' };

        case 'monthly':
        default:
          const emptyMonthlyData: ChartData[] = [];
          for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            emptyMonthlyData.push({ month: monthKey, sales: 0 });
          }
          return { data: emptyMonthlyData, dataKey: 'month', fill: '#8884d8' };
      }
    };

    const finalChartConfig = (!metrics || displayMetrics.monthlySales.length === 0) ? getEmptyChartData() : chartConfig;

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Sales",
              value: `$${displayMetrics.totalSales.toFixed(2)}`,
              colorIndex: 0
            },
            {
              title: "Total MCO",
              value: `$${displayMetrics.totalMCO.toFixed(2)}`,
              colorIndex: 1
            },
            {
              title: "Total Bookings",
              value: displayMetrics.totalBookings.toString(),
              colorIndex: 2
            },
            {
              title: "Average Sale Amount",
              value: `$${displayMetrics.averageTicketCost.toFixed(2)}`,
              colorIndex: 3
            }
          ].map((card, index) => (
            <div
              key={index}
              className={`${cardColors[card.colorIndex].bg} rounded-lg shadow p-6`}
            >
              <h3 className={`text-sm font-medium ${cardColors[card.colorIndex].text} opacity-80`}>{card.title}</h3>
              <p className={`text-2xl font-bold ${cardColors[card.colorIndex].text}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <RecentSales />

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">Sales Overview</CardTitle>
              </div>
              <div className="bg-muted rounded-lg overflow-hidden flex">
                <button
                  onClick={() => setTimeFrame('daily')}
                  className={`px-4 py-2 ${timeFrame === 'daily' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFrame('weekly')}
                  className={`px-4 py-2 ${timeFrame === 'weekly' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFrame('monthly')}
                  className={`px-4 py-2 ${timeFrame === 'monthly' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Monthly
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="pt-4">
                <h2 className="text-xl font-bold mb-1">
                  {timeFrame === 'monthly' ? 'Month-wise Sales' :
                    timeFrame === 'weekly' ? 'Week-wise Sales' :
                      'Day-wise Sales'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {timeFrame === 'monthly' ? 'Sales data for recent months' :
                    timeFrame === 'weekly' ? 'Sales data for the last 4 weeks' :
                      'Sales data for the last 7 days'}
                </p>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finalChartConfig.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey={finalChartConfig.dataKey}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value: number) => `$${value.toLocaleString()}`}
                        tickLine={false}
                        axisLine={false}
                        tickCount={5}
                      />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']} />
                      <Bar
                        dataKey="sales"
                        fill={finalChartConfig.fill}
                        radius={[4, 4, 0, 0]}
                        name="Sales"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Most Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {displayMetrics.paymentMethods.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayMetrics.paymentMethods}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {displayMetrics.paymentMethods.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'No Data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#e5e7eb"
                        dataKey="value"
                        label={() => 'No payment data'}
                      >
                        <Cell fill="#e5e7eb" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance vs Target & Client Types */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Performance vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={travelConsultantData.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Actual Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    );
  }

  // Travel Consultant Dashboard
  if (isTravelConsultant) {
    const totalRevenue = myPersonalSales.filter(sale => sale.status === 'Confirmed').reduce((sum, sale) => sum + sale.amount, 0);
    const totalBookings = myPersonalSales.length;
    const confirmedBookings = myPersonalSales.filter(sale => sale.status === 'Confirmed').length;
    const pendingBookings = myPersonalSales.filter(sale => sale.status === 'Pending').length;

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.userName}!</h1>
          <p className="text-muted-foreground">Here's your performance overview</p>
        </div>

        {/* Personal Performance Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "My Total Revenue",
              value: `$${totalRevenue.toLocaleString()}`,
              colorIndex: 0
            },
            {
              title: "Total Bookings",
              value: totalBookings,
              colorIndex: 1
            },
            {
              title: "Confirmed Bookings",
              value: confirmedBookings,
              colorIndex: 2
            },
            {
              title: "Pending Bookings",
              value: pendingBookings,
              colorIndex: 3
            }
          ].map((card, index) => (
            <div
              key={index}
              className={`${cardColors[card.colorIndex].bg} rounded-lg shadow p-6`}
            >
              <h3 className={`text-sm font-medium ${cardColors[card.colorIndex].text} opacity-80`}>{card.title}</h3>
              <p className={`text-2xl font-bold ${cardColors[card.colorIndex].text}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* My Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">My Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto text-center">
              <table className="w-full">
                <thead>
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
                  <tr>
                    <td className="p-2 text-center">
                    </td>
                  </tr>
                </tbody>
              </table>
              No data available right now.
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">My Sales Performance</CardTitle>
              </div>
              <div className="bg-muted rounded-lg overflow-hidden flex">
                <button
                  onClick={() => setTimeFrame('daily')}
                  className={`px-4 py-2 ${timeFrame === 'daily' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeFrame('weekly')}
                  className={`px-4 py-2 ${timeFrame === 'weekly' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeFrame('monthly')}
                  className={`px-4 py-2 ${timeFrame === 'monthly' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
                >
                  Monthly
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="pt-4">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartConfig.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey={chartConfig.dataKey}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        tickLine={false}
                        axisLine={false}
                        tickCount={5}
                      />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Sales']} />
                      <Bar
                        dataKey="sales"
                        fill={chartConfig.fill}
                        radius={[4, 4, 0, 0]}
                        name="Sales"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance vs Target & Client Types */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Performance vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={travelConsultantData.performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Actual Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#82ca9d" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Regional Sales Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${value}`} />
                    <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                    <Area type="monotone" dataKey="value" stroke="#8884d8" fill="url(#colorValue)" />
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Travel Consultant Dashboard
  if (isTicketConsultant) {
    const displayMetrics: ProcessedMetrics = metrics || {
      totalSales: 0,
      totalMCO: 0,
      totalBookings: 0,
      averageTicketCost: 0,
      paymentMethods: [],
      monthlySales: [],
      chargedSales: []
    };

    const mySales = displayMetrics.chargedSales.filter(
      (sale) => sale.updatedBy === user.userName
    );
    const totalMCO = mySales.reduce((sum, sale) => {
      const mco = parseFloat(sale.ticketRequest?.mco || "0");
      return sum + (isNaN(mco) ? 0 : mco);
    }, 0);
    const totalSales = totalMCO * 0.85;
    const totalBookings = mySales.length;

    const formatCurrency = (amount: string) => {
      const num = parseFloat(amount);
      return isNaN(num) ? amount : num.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });
    };

    const formatDate = (dateString: string) => {
      try {
        return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
      } catch {
        return dateString;
      }
    };

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.userName}!</h1>
          <p className="text-muted-foreground">Here's your tickte requests</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Sales",
              value: `$${totalSales.toFixed(2)}`,
              colorIndex: 0
            },
            {
              title: "Total Bookings",
              value: totalBookings,
              colorIndex: 1
            },
            {
              title: "Total MCO",
              value: `$${totalMCO}`,
              colorIndex: 2
            },
          ].map((card, index) => (
            <div
              key={index}
              className={`${cardColors[card.colorIndex].bg} rounded-lg shadow p-6`}
            >
              <h3 className={`text-sm font-medium ${cardColors[card.colorIndex].text} opacity-80`}>{card.title}</h3>
              <p className={`text-2xl font-bold ${cardColors[card.colorIndex].text}`}>{card.value}</p>
            </div>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Ticket Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700">Consultant</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Ticket Type</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Confirmation</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Cost</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Submitted</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="flex items-center justify-center h-64">
                          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                          <span className="ml-2 text-gray-600">Loading ticket requests...</span>

                        </div>
                      </td>
                    </tr>
                  ) : ticketRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center p-8 text-gray-500">
                        "No ticket requests found."
                      </td>
                    </tr>
                  ) : (
                    ticketRequests.map((request) => (
                      <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{request.consultant}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{request.passengerName}</div>
                          <div className="text-sm text-gray-500">{request.passengerEmail}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{request.ticketType || "N/A"}</div>
                          <div className="text-sm text-gray-500">{request.requestFor || "N/A"}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{request.confirmationCode}</span>
                        </td>
                        <td className="p-3">
                          <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            Ticket Cost : {formatCurrency(request.ticketCost)}
                          </div>
                          <div className="text-sm text-gray-500 px-2 py-1">MCO : {formatCurrency(request.mco)}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-700">{formatDate(request.createdAt)}</div>
                        </td>
                        <td className="p-3">
                          <div className="inline-block bg-yellow-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            {request.status || "No Status"}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  }

  // Default fallback for non-admin users
  return <div>Dashboard not available for your role.</div>;
};

export default Overview;