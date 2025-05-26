import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import CreateTravelConsultantForm from '../components/forms/CreateTravelConsultantForm.tsx';
import CreateTicketConsultantForm from '../components/forms/CreateTicketConsultantForm.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../components/ui/dialog';



const Consultants = () => {
  const [selectedForm, setSelectedForm] = useState<'travel' | 'ticket'>('travel');
  const [open, setOpen] = useState(false);

  const [consultants, setConsultants] = useState([]);



  const fetchUsers = async () => {
    axios.get(`${import.meta.env.VITE_BASE_URL}/auth/getUser`)
      .then(res => {
        const nonAdminUsers = res.data.filter(user => user.role !== 'admin');
        setConsultants(nonAdminUsers);
      })
      .catch(err => console.error(err));
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/auth/users/${id}`);
      alert('User deleted');
      fetchUsers(); // Refresh list
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  const handleUserCreated = () => {
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Consultants</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Role</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Consultant</DialogTitle>
              <DialogDescription>
                Fill out the form below to create a new consultant.
              </DialogDescription>
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
              {selectedForm === 'travel' && (
                <CreateTravelConsultantForm selectedRole={selectedForm} fetchUsers={fetchUsers} onSuccess={handleUserCreated} />
              )}
              {selectedForm === 'ticket' && (
                <CreateTicketConsultantForm selectedRole={selectedForm} fetchUsers={fetchUsers} onSuccess={handleUserCreated} />
              )}
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
              {[...consultants].reverse().map((consultant) => (
                <tr key={consultant.id} className="border-b border-border">
                  <td className="px-6 py-4 text-sm">{consultant.userName}</td>
                  <td className="px-6 py-4 text-sm">{consultant.role}</td>
                  <td className="px-6 py-4 text-sm">{consultant.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${consultant.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Button onClick={() => handleDelete(consultant._id)} variant="ghost" size="sm">Delete</Button>
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