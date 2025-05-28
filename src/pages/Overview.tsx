import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { SALES_DATA } from '../constants/auth';
import SalesList from '../components/SalesList';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Admin dummy data (your existing data)
const adminDummyData = {
  monthlySales: [
    { month: 'May 2024', sales: 35000 },
    { month: 'Jun 2024', sales: 52000 },
    { month: 'Jul 2024', sales: 48000 },
    { month: 'Aug 2024', sales: 47000 },
    { month: 'Sep 2024', sales: 45000 },
    { month: 'Oct 2024', sales: 53000 },
    { month: 'Nov 2024', sales: 48000 },
    { month: 'Dec 2024', sales: 51000 },
    { month: 'Jan 2025', sales: 40000 },
    { month: 'Feb 2025', sales: 49000 },
    { month: 'Mar 2025', sales: 47000 },
    { month: 'Apr 2025', sales: 50000 },
    { month: 'May 2025', sales: 12000 },
  ],
  weeklySales: [
    { week: 'Week 1', sales: 12000 },
    { week: 'Week 2', sales: 15000 },
    { week: 'Week 3', sales: 18000 },
    { week: 'Week 4', sales: 14000 },
  ],
  dailySales: [
    { day: 'Mon', sales: 8000 },
    { day: 'Tue', sales: 7500 },
    { day: 'Wed', sales: 9000 },
    { day: 'Thu', sales: 8200 },
    { day: 'Fri', sales: 7800 },
    { day: 'Sat', sales: 5500 },
    { day: 'Sun', sales: 4000 },
  ],
  categoryData: [
    { name: 'Economy', value: 45 },
    { name: 'Business', value: 30 },
    { name: 'First Class', value: 25 },
  ],
  salesTrend: [
    { name: 'Jan', online: 4000, offline: 2400 },
    { name: 'Feb', online: 3000, offline: 1398 },
    { name: 'Mar', online: 2000, offline: 9800 },
    { name: 'Apr', online: 2780, offline: 3908 },
    { name: 'May', online: 1890, offline: 4800 },
  ],
  regionSales: [
    { name: 'North', value: 12400 },
    { name: 'South', value: 15600 },
    { name: 'East', value: 8900 },
    { name: 'West', value: 14200 },
  ]
};

// Travel consultant dummy data
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

// My personal sales data for travel consultant
const myPersonalSales = [
  { id: 1, client: 'John Smith', destination: 'Dubai', amount: 1250, date: '2025-05-25', status: 'Confirmed' },
  { id: 2, client: 'Sarah Johnson', destination: 'London', amount: 980, date: '2025-05-24', status: 'Pending' },
  { id: 3, client: 'Mike Brown', destination: 'Tokyo', amount: 1450, date: '2025-05-23', status: 'Confirmed' },
  { id: 4, client: 'Emma Davis', destination: 'Paris', amount: 750, date: '2025-05-22', status: 'Confirmed' },
  { id: 5, client: 'David Wilson', destination: 'New York', amount: 1100, date: '2025-05-21', status: 'Cancelled' },
];

// Card color configurations
const cardColors = [
  { bg: 'bg-gradient-to-br from-blue-500 to-blue-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-purple-500 to-purple-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-green-500 to-green-600', text: 'text-white' },
  { bg: 'bg-gradient-to-br from-amber-500 to-amber-600', text: 'text-white' },
];

// Pie chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Overview = () => {
  const { user } = useAuth();
  const [timeFrame, setTimeFrame] = useState('monthly');

  const isAdmin = user?.role === 'admin';
  const isTravelConsultant = user?.role === 'travel';
  const isTicketConsultant = user?.role === 'ticket';

  // Use appropriate data based on role
  const dummyData = isAdmin ? adminDummyData : travelConsultantData;

  // Determine which data to show based on selected timeframe
  const getChartData = () => {
    switch (timeFrame) {
      case 'daily':
        return {
          data: dummyData.dailySales,
          dataKey: 'day',
          fill: '#8884d8'
        };
      case 'weekly':
        return {
          data: dummyData.weeklySales,
          dataKey: 'week',
          fill: '#82ca9d'
        };
      case 'monthly':
      default:
        return {
          data: dummyData.monthlySales,
          dataKey: 'month',
          fill: '#8884d8'
        };
    }
  };

  const chartConfig = getChartData();

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Sales",
              value: `$${SALES_DATA.reduce((sum, sale) => sum + sale.ticketCostUSD, 0).toFixed(2)}`,
              colorIndex: 0
            },
            {
              title: "Total MCO",
              value: `$${SALES_DATA.reduce((sum, sale) => sum + sale.mcoUSD, 0).toFixed(2)}`,
              colorIndex: 1
            },
            {
              title: "Total Bookings",
              value: SALES_DATA.length,
              colorIndex: 2
            },
            {
              title: "Average Ticket Cost",
              value: `$${(SALES_DATA.reduce((sum, sale) => sum + sale.ticketCostUSD, 0) / SALES_DATA.length).toFixed(2)}`,
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

        <SalesList />

        {/* Rest of admin dashboard charts */}
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
                  {timeFrame === 'monthly' ? 'Sales data for the last 12 months' :
                    timeFrame === 'weekly' ? 'Sales data for the last 4 weeks' :
                      'Sales data for the last 7 days'}
                </p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Ticket Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={adminDummyData.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {adminDummyData.categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <AreaChart data={adminDummyData.regionSales}>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Client</th>
                    <th className="text-left p-2">Destination</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myPersonalSales.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-2">{sale.client}</td>
                      <td className="p-2">{sale.destination}</td>
                      <td className="p-2">${sale.amount}</td>
                      <td className="p-2">{sale.date}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${sale.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                          }`}>
                          {sale.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  if (isTicketConsultant) {
    const totalRevenue = myPersonalSales.filter(sale => sale.status === 'Confirmed').reduce((sum, sale) => sum + sale.amount, 0);
    const totalBookings = myPersonalSales.length;
    const confirmedBookings = myPersonalSales.filter(sale => sale.status === 'Confirmed').length;
    const pendingBookings = myPersonalSales.filter(sale => sale.status === 'Pending').length;

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.userName}!</h1>
          <p className="text-muted-foreground">Here's your tickte requests</p>
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
            <CardTitle className="text-2xl font-bold">Ticket Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table>
              //here all ticket-requests
              </table>
            </div>
          </CardContent>
        </Card>


      </div>
    );
  }

  // Default fallback
  return <div>Dashboard not available for your role.</div>;
};

export default Overview;