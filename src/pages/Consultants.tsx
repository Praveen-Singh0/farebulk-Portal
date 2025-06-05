import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import CreateTravelConsultantForm from '../components/forms/CreateTravelConsultantForm';
import CreateTicketConsultantForm from '../components/forms/CreateTicketConsultantForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../components/ui/dialog';

// Define the User type here (adjust fields as needed)
interface User {
  _id: string;
  id?: string;
  userName: string;
  role: string;
  email: string;
  status: string;
}

const Consultants = () => {
  const [selectedForm, setSelectedForm] = useState<'travel' | 'ticket'>('travel');
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);


  // Use User[] type for consultants
  const [consultants, setConsultants] = useState<User[]>([]);

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/auth/getUser`);
      // Use User type here for the filter callback parameter
      const nonAdminUsers = res.data.filter((user: User) => user.role !== 'admin');
      setConsultants(nonAdminUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false)
    }
  };

  const handleDelete = async (id: string) => {
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
                <CreateTravelConsultantForm
                  selectedRole={selectedForm}
                  fetchUsers={fetchUsers}
                  onSuccess={handleUserCreated}
                />
              )}
              {selectedForm === 'ticket' && (
                <CreateTicketConsultantForm
                  selectedRole={selectedForm}
                  fetchUsers={fetchUsers}
                  onSuccess={handleUserCreated}
                />
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
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
                  </td>
                </tr>
              ) : (
                <>
                  {[...consultants].reverse().map((consultant) => (
                    <tr key={consultant._id} className="border-b border-border">
                      <td className="px-6 py-4 text-sm">{consultant.userName}</td>
                      <td className="px-6 py-4 text-sm">{consultant.role}</td>
                      <td className="px-6 py-4 text-sm">{consultant.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${'bg-green-100 text-green-800'
                            }`}
                        >
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          onClick={() => handleDelete(consultant._id)}
                          variant="ghost"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </>

              )}

            </tbody>


          </table>
        </div>
      </div>
    </div>
  );
};

export default Consultants;
