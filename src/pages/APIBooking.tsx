import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, Plane, CreditCard, User, Trash2, Globe, Filter, RefreshCw } from 'lucide-react';

// TypeScript Interfaces
interface PassengerEntry {
  id: number;
  gender: string;
  firstName: string;
  middleName: string;
  lastName: string;
  age: string;
  _id: string;
}

interface WebsiteSource {
  id: string;
  name: string;
  baseUrl: string;
}

interface FlightUser {
  _id: string;
  email: string;
  phone: string;
  bookingNumber: string;
  cardNumber: number;
  createdAt: string;
  cvv: number;
  departureDate: string;
  entries: PassengerEntry[];
  expMonth: number;
  expYear: number;
  fareIncrease?: number;
  flightBookingType: string;
  flightCarrierCode: string;
  flightFrom: string;
  flightTo: string;
  flightFulldetails?: any;
  nameOnCard: string;
  price: number;
  updatedAt: string;
  __v: number;
  websiteSource: WebsiteSource;

}

interface WebsiteSummary {
  website: string;
  websiteId: string;
  success: boolean;
  count: number;
  error?: string;
  status?: string;
}

interface ApiResponse {
  success: boolean;
  totalUsers: number;
  totalWebsites: number;
  successfulWebsites: number;
  failedWebsites: number;
  websiteSummary: WebsiteSummary[];
  data: FlightUser[];
  fetchedAt: string;
}

const MultiSiteFlightUsersTable: React.FC = () => {
  const [users, setUsers] = useState<FlightUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<FlightUser | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, user: FlightUser | null }>({
    show: false,
    user: null
  });
  const [deleting, setDeleting] = useState<boolean>(false);
  const [websiteSummary, setWebsiteSummary] = useState<WebsiteSummary[]>([]);
  const [selectedWebsiteFilter, setSelectedWebsiteFilter] = useState<string>('all');
  const [lastFetched, setLastFetched] = useState<string>('');

  useEffect(() => {
    fetchAllFlightUsers();
  }, []);

  const fetchAllFlightUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/flight-users/all`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        setUsers(result.data);
        setWebsiteSummary(result.websiteSummary);
        setLastFetched(result.fetchedAt);
      } else {
        console.error('Failed to fetch users from all websites');
      }
    } catch (error) {
      console.error('Error fetching flight users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user: FlightUser): void => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = (): void => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const openDeleteConfirm = (user: FlightUser): void => {
    setDeleteConfirm({ show: true, user });
  };

  const closeDeleteConfirm = (): void => {
    setDeleteConfirm({ show: false, user: null });
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteConfirm.user) return;

    try {
      setDeleting(true);
      const { websiteSource, _id } = deleteConfirm.user;

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/flight-users/${websiteSource.id}/${_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setUsers(prevUsers => prevUsers.filter(user => user._id !== deleteConfirm.user!._id));
        closeDeleteConfirm();
      } else {
        alert(`Failed to delete booking from ${result.website}: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPassengerName = (entries: PassengerEntry[]): string => {
    if (entries && entries.length > 0) {
      const passenger = entries[0];
      return `${passenger.firstName} ${passenger.lastName}`.trim();
    }
    return 'N/A';
  };

  const getWebsiteColor = (websiteId: string): string => {
    const colors = {
      'easyflightsbook': 'bg-blue-100 text-blue-800',
      'airticketspot': 'bg-green-100 text-green-800',
      'easyflightnow': 'bg-purple-100 text-purple-800',
      // 'airtravel': 'bg-orange-100 text-orange-800',
      // 'flightmaster': 'bg-red-100 text-red-800',
      // 'jetbook': 'bg-indigo-100 text-indigo-800'
    };
    return colors[websiteId as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = selectedWebsiteFilter === 'all'
    ? users
    : users.filter(user => user.websiteSource.id === selectedWebsiteFilter);

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  //     </div>
  //   );
  // }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Online Flight Bookings</h1>
            {lastFetched && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDate(lastFetched)}
              </p>
            )}
          </div>
          <button
            onClick={fetchAllFlightUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Website Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {websiteSummary.map((website) => (
            <div key={website.websiteId} className={`p-4 rounded-lg border ${website.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <Globe className={`h-5 w-5 ${website.success ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`px-2 py-1 text-xs rounded-full ${website.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {website.success ? 'Online' : 'Error'}
                </span>
              </div>
              <h3 className="font-semibold text-sm mt-2 truncate" title={website.website}>
                {website.website}
              </h3>
              <p className="text-lg font-bold text-gray-900">{website.count}</p>
              {website.error && (
                <p className="text-xs text-red-600 mt-1 truncate" title={website.error}>
                  {website.error}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <Filter className="h-5 w-5 text-blue-600" />

              <label htmlFor="websiteFilter" className="text-sm font-medium text-gray-700">
                Filter by Website
              </label>

              <div className="relative w-64">
                <select
                  id="websiteFilter"
                  value={selectedWebsiteFilter}
                  onChange={(e) => setSelectedWebsiteFilter(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2 pr-10 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">
                    All Websites ({users.length})
                  </option>
                  {websiteSummary
                    .filter(w => w.success && w.count > 0)
                    .map((website) => (
                      <option key={website.websiteId} value={website.websiteId}>
                        {website.website} ({website.count})
                      </option>
                    ))}
                </select>

                {/* Down Arrow Icon */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  {/* <ChevronDown className="h-4 w-4 text-gray-400" /> */}
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading data...</span>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passenger</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user: FlightUser) => (
                    <tr key={`${user.websiteSource.id}-${user._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWebsiteColor(user.websiteSource.id)}`}>
                          <Globe className="h-3 w-3 mr-1" />
                          {user.websiteSource.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.bookingNumber}</div>
                          <div className="text-sm text-gray-500">{user.flightCarrierCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getPassengerName(user.entries)}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{user.flightFrom}</span>
                          <Plane className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">{user.flightTo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">${user.price}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(user)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                          </button>
                          {/* <button
                            onClick={() => openDeleteConfirm(user)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>


        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No flight bookings found for the selected filter.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Booking Details - {selectedUser.bookingNumber}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${getWebsiteColor(selectedUser.websiteSource.id)}`}>
                  <Globe className="h-3 w-3 mr-1" />
                  {selectedUser.websiteSource.name}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Website Information */}
                {/* <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <Globe className="h-5 w-5 mr-2" />
                    Website Information
                  </h4>
                  <div className="space-y-2">
                    <p><strong>Website:</strong> {selectedUser.websiteSource.name}</p>
                    <p><strong>Website ID:</strong> {selectedUser.websiteSource.id}</p>
                    <p><strong>Base URL:</strong> {selectedUser.websiteSource.baseUrl}</p>
                  </div>
                </div> */}

                {/* Passenger Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <User className="h-5 w-5 mr-2" />
                    Passenger Information
                  </h4>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {getPassengerName(selectedUser.entries)}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone}</p>
                    {selectedUser.entries && selectedUser.entries[0] && (
                      <p><strong>Gender:</strong> {selectedUser.entries[0].gender}</p>
                    )}
                  </div>
                </div>

                {/* Flight Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <Plane className="h-5 w-5 mr-2" />
                    Flight Information
                  </h4>
                  <div className="space-y-2">
                    <p><strong>From:</strong> {selectedUser.flightFrom}</p>
                    <p><strong>To:</strong> {selectedUser.flightTo}</p>
                    <p><strong>Carrier:</strong> {selectedUser.flightCarrierCode}</p>
                    <p><strong>Type:</strong> {selectedUser.flightBookingType}</p>
                    <p><strong>Departure:</strong> {selectedUser.departureDate}</p>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </h4>
                  <div className="space-y-2">
                    <p><strong>Total Price:</strong> ${selectedUser.price}</p>
                    <p><strong>Card Holder:</strong> {selectedUser.nameOnCard}</p>
                    <p><strong>Card Number:</strong> {selectedUser.cardNumber}</p>
                    <p><strong>CVV:</strong> {selectedUser.cvv}</p>
                    <p><strong>Expiry:</strong> {selectedUser.expMonth}/{selectedUser.expYear}</p>
                    {selectedUser.fareIncrease && (
                      <p><strong>Fare Increase:</strong> ${selectedUser.fareIncrease}</p>
                    )}
                  </div>
                </div>

                {/* Booking Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <Calendar className="h-5 w-5 mr-2" />
                    Booking Information
                  </h4>
                  <div className="space-y-2">
                    <p><strong>Booking Number:</strong> {selectedUser.bookingNumber}</p>
                    <p><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</p>
                    <p><strong>Updated:</strong> {formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Flight Details */}
              {selectedUser.flightFulldetails && (
                <div className="mt-6  rounded-lg">
                  <div >
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedUser.flightFulldetails, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && deleteConfirm.user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Delete Booking
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete booking <strong>{deleteConfirm.user.bookingNumber}</strong>?
                  <br />
                  Website: <strong>{deleteConfirm.user.websiteSource.name}</strong>
                  <br />
                  Passenger: <strong>{getPassengerName(deleteConfirm.user.entries)}</strong>
                  <br />
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSiteFlightUsersTable;