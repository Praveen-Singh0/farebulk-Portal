import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import SalesList from '../components/SalesList';
const dummyData = {
  travelConsultants: [
    { name: 'Amit Sharma', sales: 45000 },
    { name: 'Priya Verma', sales: 38000 },
    { name: 'Rohit Mehra', sales: 29000 },
    { name: 'Sneha Kapoor', sales: 42000 },
  ],
  ticketConsultants: [
    { name: 'Vikram Desai', sales: 32000 },
    { name: 'Anjali Nair', sales: 28000 },
    { name: 'Karan Malhotra', sales: 35000 },
    { name: 'Neha Iyer', sales: 31000 },
  ],
  
  monthlySales: [
    { month: 'Jan', travel: 120000, ticket: 95000 },
    { month: 'Feb', travel: 135000, ticket: 110000 },
    { month: 'Mar', travel: 150000, ticket: 125000 },
    { month: 'Apr', travel: 140000, ticket: 115000 },
    { month: 'May', travel: 160000, ticket: 130000 },
    { month: 'Jun', travel: 170000, ticket: 140000 },
  ],
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SalesOverview = () => {
  const totalTravelSales = dummyData.travelConsultants.reduce((sum, item) => sum + item.sales, 0);
  const totalTicketSales = dummyData.ticketConsultants.reduce((sum, item) => sum + item.sales, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalTravelSales + totalTicketSales).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Travel Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTravelSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalTicketSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Consultants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+2 new this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Travel Consultant Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dummyData.travelConsultants}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="sales"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dummyData.travelConsultants.map((_, index) => (
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

      </div>

      <SalesList/>
    </div>
  );
};

export default SalesOverview; 