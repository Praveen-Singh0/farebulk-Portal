import { useState } from 'react';
import { Eye, X } from 'lucide-react';

interface TicketRequestData {
  id: number;
  date: string;
  passenger: string;
  email: string;
  airline: string;
  confirmation: string;
  amount: number;
  mco: number;
  status: "Pending" | "Confirmed";
  // Adding credit card information
  creditCard: {
    number: string;
    nameOnCard: string;
    expiryDate: string;
    cvv: string;
  };
}

const TicketRequest = () => {
  const [requests, setRequests] = useState<TicketRequestData[]>([
    {
      id: 1,
      date: "2025-05-08",
      passenger: "Emily Johnson",
      email: "emily.johnson@example.com",
      airline: "Delta Airlines",
      confirmation: "DL12345",
      amount: 520.75,
      mco: 50.00,
      status: "Pending",
      creditCard: {
        number: "4111 2222 3333 4444",
        nameOnCard: "Emily Johnson",
        expiryDate: "09/26",
        cvv: "123"
      }
    },
    {
      id: 2,
      date: "2025-05-07",
      passenger: "Michael Chen",
      email: "michael.chen@example.com",
      airline: "American Airlines",
      confirmation: "AA78901",
      amount: 475.50,
      mco: 35.00,
      status: "Pending",
      creditCard: {
        number: "5555 6666 7777 8888",
        nameOnCard: "Michael Chen",
        expiryDate: "12/25",
        cvv: "456"
      }
    },
    {
      id: 3,
      date: "2025-05-06",
      passenger: "Sophia Rodriguez",
      email: "sophia.r@example.com",
      airline: "United Airlines",
      confirmation: "UA54321",
      amount: 620.25,
      mco: 40.00,
      status: "Pending",
      creditCard: {
        number: "3782 8224 6310 005",
        nameOnCard: "Sophia Rodriguez",
        expiryDate: "03/27",
        cvv: "789"
      }
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState<TicketRequestData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleView = (id: number): void => {
    const request = requests.find(req => req.id === id);
    if (request) {
      setSelectedRequest(request);
      setShowModal(true);
    }
  };

  const closeModal = (): void => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleConfirm = () => {
    // Logic to mark the ticket as confirmed
    if (selectedRequest) {
      const updatedRequests = requests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: "Confirmed" as "Confirmed" } : req
      );
      setRequests(updatedRequests);
    }
    setShowConfirmDialog(false);
    closeModal();
  };

  const handlePending = () => {
    if (selectedRequest) {
      const updatedRequests = requests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: "Pending" as const } : req
      );
      setRequests(updatedRequests);
    }
    closeModal();
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Ticket Requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Passenger</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Airline</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Confirmation</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm">{request.date}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">{request.passenger}</div>
                        <div className="text-muted-foreground">{request.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{request.airline}</td>
                    <td className="px-6 py-4 text-sm">{request.confirmation}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <div className="font-medium">${request.amount.toFixed(2)}</div>
                        <div className="text-muted-foreground">MCO: ${request.mco.toFixed(2)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        request.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleView(request.id)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Modal backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 transition-opacity" 
            onClick={closeModal}
            aria-hidden="true"
          ></div>
          
          {/* Modal content */}
          <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 z-10">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h3 className="text-lg font-semibold">Ticket Request Details</h3>
              <button 
                onClick={closeModal}
                className="p-1 rounded-md hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm">{selectedRequest.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedRequest.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Passenger</p>
                  <p className="text-sm font-medium">{selectedRequest.passenger}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Airline</p>
                  <p className="text-sm">{selectedRequest.airline}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmation</p>
                  <p className="text-sm">{selectedRequest.confirmation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-medium">${selectedRequest.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">MCO: ${selectedRequest.mco.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Credit Card Section */}
              <div>
                <h4 className="text-md font-semibold mb-3">Payment Information</h4>
                <div className="bg-muted/40 rounded-md p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Card Number</p>
                      <p className="text-sm">{selectedRequest.creditCard.number}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Name on Card</p>
                      <p className="text-sm">{selectedRequest.creditCard.nameOnCard}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <p className="text-sm">{selectedRequest.creditCard.expiryDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CVV</p>
                      <p className="text-sm">{selectedRequest.creditCard.cvv}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 border-t border-border p-4">
              {selectedRequest.status === "Pending" ? (
                <button
                  className="px-4 py-2 bg-green-400 hover:bg-green-200 rounded-md"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to confirm this ticket request?")) {
                      handleConfirm();
                    }
                  }}
                >
                  Confirm
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-yellow-400 hover:bg-yellow-200 rounded-md"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to mark this ticket as pending?")) {
                      handlePending();
                    }
                  }}
                >
                  Pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketRequest;