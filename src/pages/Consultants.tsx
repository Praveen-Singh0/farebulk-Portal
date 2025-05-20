import { useState } from 'react';
import { Button } from '../components/ui/button';
import CreateTravelConsultantForm from '../components/forms/CreateTravelConsultantForm.tsx';
import CreateTicketConsultantForm from '../components/forms/CreateTicketConsultantForm.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

// Dummy data for consultants
const consultants = [
  { id: 1, name: 'Rajiv Kumar', role: 'Travel Consultant', email: 'rajiv.kumar@example.com', status: 'Active' },
  { id: 2, name: 'Meera Singh', role: 'Ticket Consultant', email: 'meera.singh@example.com', status: 'Active' },
  { id: 3, name: 'Arun Joshi', role: 'Travel Consultant', email: 'arun.joshi@example.com', status: 'Inactive' },
];


const Consultants = () => {
  const [selectedForm, setSelectedForm] = useState<'travel' | 'ticket'>('travel');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Consultants</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Create Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Consultant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  variant={selectedForm === 'travel' ? 'default' : 'outline'}
                  onClick={() => setSelectedForm('travel')}
                >
                  Travel Consultant
                </Button>
                <Button
                  variant={selectedForm === 'ticket' ? 'default' : 'outline'}
                  onClick={() => setSelectedForm('ticket')}
                >
                  Ticket Consultant
                </Button>
              </div>
              {selectedForm === 'travel' && <CreateTravelConsultantForm />}
              {selectedForm === 'ticket' && <CreateTicketConsultantForm />}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultants.map((consultant) => (
                <tr key={consultant.id} className="border-b border-border">
                  <td className="px-6 py-4 text-sm">{consultant.name}</td>
                  <td className="px-6 py-4 text-sm">{consultant.role}</td>
                  <td className="px-6 py-4 text-sm">{consultant.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      consultant.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {consultant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button variant="ghost" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm">Delete</Button>
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

export default Consultants; 