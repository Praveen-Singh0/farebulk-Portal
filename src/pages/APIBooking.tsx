import React, { useState, useEffect } from 'react';
import { Eye, X, Calendar, Plane, CreditCard, User, Trash2, Globe, Filter, RefreshCw, Clock, MapPin, Users } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/contexts/use-auth';



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

interface PassengersTableProps {
  selectedUser: FlightUser;
}


const MultiSiteFlightUsersTable: React.FC = () => {
  const { user } = useAuth();
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


  const isAdmin = user?.role === 'admin';
  const isTicketConsultant = user?.role === 'ticket';

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

  const formatTime = (isoString?: string): string => {
    return new Date(isoString ?? '').toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };


  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+)H(\d+)M/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return duration;
  };


  const getAirportName = (code: string): string => {
    const airports: Record<string, string> = {
      'ONT': 'Ontario International Airport',
      'DEN': 'Denver International Airport',
      'LAX': 'Los Angeles International Airport'
    };
    return airports[code] || code;
  };



  const getCarrierName = (code: string): string => {
    const carriers: Record<string, string> = {
      'F9': 'Frontier Airlines'
    };
    return carriers[code] || code;
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


  const PassengersTable: React.FC<PassengersTableProps> = ({ selectedUser }) => {
    if (!selectedUser || !selectedUser.entries || selectedUser.entries.length === 0) {
      return <div className="text-gray-500">No passengers found</div>;
    }

    return (
      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg mt-4">
        <h4 className="flex items-center text-sm sm:text-md font-semibold text-gray-800 mb-3">
          <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          All Passengers
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 border-b">ID</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 border-b">First Name</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 border-b hidden sm:table-cell">Middle Name</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 border-b">Last Name</th>
                <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-gray-700 border-b">Gender</th>
              </tr>
            </thead>
            <tbody>
              {selectedUser.entries.map((passenger, index) => (
                <tr key={passenger._id || passenger.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 border-b">{passenger.id}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 border-b">{passenger.firstName || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 border-b hidden sm:table-cell">{passenger.middleName || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 border-b">{passenger.lastName || '-'}</td>
                  <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 border-b">
                    <span className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium ${passenger.gender === 'Male' ? 'bg-blue-100 text-blue-800' :
                      passenger.gender === 'Female' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                      {passenger.gender}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Online Flight Bookings</h1>
            {lastFetched && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Last updated: {formatDate(lastFetched)}
              </p>
            )}
          </div>
          <button
            onClick={fetchAllFlightUsers}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Website Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {websiteSummary.map((website) => (
            <div key={website.websiteId} className={`p-3 sm:p-4 rounded-lg border ${website.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <Globe className={`h-4 w-4 sm:h-5 sm:w-5 ${website.success ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`px-2 py-1 text-xs rounded-full ${website.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {website.success ? 'Online' : 'Error'}
                </span>
              </div>
              <h3 className="font-semibold text-xs sm:text-sm mt-2 truncate" title={website.website}>
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
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
              <label htmlFor="websiteFilter" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Filter by Website
              </label>
              <div className="relative flex-1 sm:w-48 lg:w-64">
                <Select
                  value={selectedWebsiteFilter}
                  onValueChange={(value) => setSelectedWebsiteFilter(value)}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={`All Websites (${users.length})`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">
                        All Websites ({users.length})
                      </SelectItem>

                      {/* Dynamic options from websiteSummary */}
                      {websiteSummary
                        .filter((w) => w.success && w.count > 0)
                        .map((website) => (
                          <SelectItem
                            key={website.websiteId}
                            value={website.websiteId}
                          >
                            {website.website} ({website.count})
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View for small screens */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user: FlightUser) => (
                <div key={`${user.websiteSource.id}-${user._id}`} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWebsiteColor(user.websiteSource.id)}`}>
                      <Globe className="h-3 w-3 mr-1" />
                      {user.websiteSource.name}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal(user)}
                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      {(isTicketConsultant || isAdmin) && (
                        <button
                          onClick={() => openDeleteConfirm(user)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Del
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.bookingNumber}</p>
                      <p className="text-xs text-gray-500">{user.flightCarrierCode}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getPassengerName(user.entries)}
                        {user.entries.length > 1 && (
                          <span className='text-sm font-medium text-red-900'> + {user.entries.length - 1} more</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{user.flightFrom}</span>
                        <Plane className="h-3 w-3 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{user.flightTo}</span>
                      </div>
                      <span className="text-sm font-bold text-green-600">${user.price}</span>
                    </div>

                    <p className="text-xs text-gray-500">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden hidden lg:block">
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
                          <div className="text-sm font-medium text-gray-900">{getPassengerName(user.entries)}
                            {user.entries.length > 1 && (
                              <span className='text-sm font-medium text-red-900'> + {user.entries.length - 1} more</span>
                            )}
                          </div>
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
                          {(isTicketConsultant || isAdmin) && (
                            <button
                              onClick={() => openDeleteConfirm(user)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No flight bookings found for the selected filter.</p>
          </div>
        )}
      </div>











      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 sm:top-8 mx-auto p-3 sm:p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white mb-4">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Booking Confirmation
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-lg font-semibold text-blue-600">
                    {selectedUser.bookingNumber}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Globe className="h-4 w-4 mr-1" />
                    {selectedUser.websiteSource.name}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {selectedUser.flightBookingType.toUpperCase()}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto space-y-6">
              {/* Traveler Details Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Traveler(s) Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email:</p>
                    <p className="font-medium text-blue-600">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Passenger:</p>
                    <p className="font-medium text-blue-600">{selectedUser.entries.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Billing No:</p>
                    <p className="font-medium">{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Card No:</p>
                    <p className="font-medium">{selectedUser.cardNumber.toString().replace(/(\d{4})(?=\d)/g, '$1-')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Booking Reference:</p>
                    <p className="font-bold text-lg text-blue-600">{selectedUser.bookingNumber}</p>
                  </div>
                </div>
              </div>

              {/* Itinerary Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <Plane className="h-5 w-5 mr-2 text-gray-600" />
                  Itinerary Details
                </h4>

                {selectedUser.flightFulldetails.itineraries.map((itinerary: [], index) => (
                  <div key={index} className="mb-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Flight Detail */}
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Plane className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{getCarrierName(selectedUser.flightCarrierCode)}</p>
                            <p className="text-sm text-gray-600">Flight no: {itinerary.segments[0].number}</p>
                          </div>
                        </div>

                        {/* Departure Airport */}
                        <div>
                          <p className="font-semibold text-gray-800">Departure</p>
                          <p className="text-lg font-medium">{itinerary.segments[0].departure.iataCode}</p>
                          <p className="text-sm text-gray-600">Terminal: {itinerary.segments[0].departure.terminal || 'N/A'}</p>
                          <p className="text-red-600 font-medium">
                            {new Date(itinerary.segments[0].departure.at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}, {formatTime(itinerary.segments[0].departure.at)}
                          </p>
                        </div>

                        {/* Arrival Airport */}
                        <div>
                          <p className="font-semibold text-gray-800">Arrival</p>
                          <p className="text-lg font-medium">{itinerary.segments[0].arrival.iataCode}</p>
                          <p className="text-sm text-gray-600">Terminal: {itinerary.segments[0].arrival.terminal || 'N/A'}</p>
                          <p className="text-red-600 font-medium">
                            {new Date(itinerary.segments[0].arrival.at).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}, {formatTime(itinerary.segments[0].arrival.at)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Duration: {formatDuration(itinerary.duration)}</span>
                          <span>Aircraft: {itinerary.segments[0].aircraft.code}</span>
                          <span>Stops: {itinerary.segments[0].numberOfStops}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reservation Details Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Reservation Details
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full bg-white rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">First Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Middle Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.entries.map((passenger, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="px-4 py-3 text-sm">{passenger.firstName}</td>
                          <td className="px-4 py-3 text-sm">{passenger.middleName || '-'}</td>
                          <td className="px-4 py-3 text-sm">{passenger.lastName}</td>
                          <td className="px-4 py-3 text-sm">{passenger.gender}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-green-50 flex p-4 rounded-lg border border-green-200">
                <h4 className="flex items-center text-lg font-semibold text-gray-800 mb-4">
                  <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                  Total Price
                </h4>
                <div className="text-3xl ml-4 font-bold text-green-600">
                  $ {selectedUser.price.toFixed(2)}
                </div>
                {selectedUser.fareIncrease && (
                  <div className="text-sm text-red-600 mt-1">
                    (Includes fare increase: ${selectedUser.fareIncrease})
                  </div>
                )}
              </div>

              {/* Additional Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Card Holder:</strong> {selectedUser?.nameOnCard}</p>
                    <p><strong>Card Number:</strong> {selectedUser.cardNumber.toString().replace(/(\d{4})(?=\d)/g, '$1-')}</p>
                    <p><strong>CVV:</strong> {selectedUser?.cvv}</p>
                    <p><strong>Expiry:</strong> {selectedUser.expMonth.toString().padStart(2, '0')}/{selectedUser.expYear}</p>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="flex items-center text-md font-semibold text-gray-800 mb-3">
                    <Calendar className="h-5 w-5 mr-2" />
                    Booking Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Booking Number:</strong> {selectedUser.bookingNumber}</p>
                    <p><strong>Booking Type:</strong> {selectedUser.flightBookingType.toUpperCase()}</p>
                    <p><strong>Created:</strong> {formatDate(selectedUser.createdAt)}</p>
                    <p><strong>Updated:</strong> {formatDate(selectedUser.updatedAt)}</p>
                    <p><strong>Total Passengers:</strong> {selectedUser.entries.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
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