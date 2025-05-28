import { Routes, Route, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import TravelConsultantForm from '../components/forms/TravelConsultantForm';
import TicketConsultantForm from '../components/forms/TicketConsultantForm';
import Overview from './Overview';
import SalesOverview from '../components/SalesOverview';
import Sidebar from '../components/Sidebar';
import Consultants from './Consultants';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import TicketRequest from './TicketRequest';
import Submission from './Submissions';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar role={user.role} />
      </div>
      
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-foreground">Farebulk Portal</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user.userName}
              </span>
              <Button
                variant="ghost"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="sales" element={<SalesOverview />} />
            <Route path="forms" element={
              <div className="space-y-6">
                {user.role === 'travel' && (
                  <div className="bg-card shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-foreground">Create New Sale</h3>
                      <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                        <p>Please carefully fill out this form.</p>
                      </div>
                      <div className="mt-5">
                        <TravelConsultantForm user={user} />
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'ticket' && (
                  <div className="bg-card shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-foreground">Ticket Consultant Form</h3>
                      <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                        <p>Submit ticket consultant information here.</p>
                      </div>
                      <div className="mt-5">
                        <TicketConsultantForm />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            } />
            <Route path="reports" element={<div>Reports Page</div>} />
            <Route path="consultants" element={<Consultants />} />
            <Route path="settings" element={<div>Settings Page</div>} />
            <Route path="my-sales" element={<div>My Sales Page</div>} />
            <Route path="ticket-request" element={<TicketRequest />} />
            <Route path="profile" element={<div>Profile Page</div>} />
            <Route path="submissions" element={<div><Submission/></div>} />
            <Route path="ticket_request" element={<div>Ticket request</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 