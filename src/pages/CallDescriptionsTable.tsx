import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, Trash2 } from 'lucide-react';
import axios from 'axios';

interface CallDescription {
  _id: string;
  sourceNumber: string;
  destination: string;
  callDuration: string;
  status: string;
  callConversation: string;
  date: string;
  user?: string;
}

interface Props {
  isAdmin?: boolean;
  isTicketConsultant?: boolean;
}

const CallDescriptionsTable: React.FC<Props> = ({ isAdmin = true, isTicketConsultant = true }) => {
  const [data, setData] = useState<CallDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch data with better error handling
  const fetchData = async () => {
    console.log('Fetching data...', { isAdmin, isTicketConsultant });
    
    if (!isAdmin && !isTicketConsultant) {
      console.log('User does not have permission');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const baseURL = import.meta.env.VITE_BASE_URL;
      console.log('Base URL:', baseURL);
      
      const response = await axios.get(`${baseURL}/call-descriptions`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setData(response.data.data || []);
        console.log('Data set:', response.data.data);
      } else {
        setError('Failed to fetch data');
        console.error('API returned success: false');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
        } else if (error.request) {
          setError('Network error: No response from server');
        } else {
          setError(`Request error: ${error.message}`);
        }
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm('Delete this call?')) return;
    
    try {
      const baseURL = import.meta.env.VITE_BASE_URL;
      const response = await axios.delete(`${baseURL}/call-descriptions/${id}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setData(prev => prev.filter(item => item._id !== id));
      } else {
        alert('Failed to delete: ' + response.data.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    }
  };

  // Download CSV
  const downloadCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['S.No', 'Source', 'Destination', 'Duration', 'Status', 'Conversation', 'Date'];
    const rows = data.map((item, index) => [
      index + 1,
      item.sourceNumber,
      item.destination,
      item.callDuration,
      item.status,
      item.callConversation.replace(/"/g, '""'),
      item.date,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calls-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Answered': 'bg-green-100 text-green-800',
      'Missed': 'bg-red-100 text-red-800',
      'Busy': 'bg-yellow-100 text-yellow-800',
      'Declined': 'bg-red-100 text-red-800',
      'No Answer': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin, isTicketConsultant]);

  // Debug info
  console.log('Component render:', { 
    loading, 
    dataLength: data.length, 
    error, 
    isAdmin, 
    isTicketConsultant 
  });

  if (!isAdmin && !isTicketConsultant) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        No permission to view call descriptions
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold">Call Descriptions</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            disabled={data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading call descriptions...</span>
          </div>
        ) : (
          <>
            {/* Always show table structure */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-semibold border">Source</th>
                    <th className="text-left p-3 font-semibold border">Destination</th>
                    <th className="text-left p-3 font-semibold border">Duration</th>
                    <th className="text-left p-3 font-semibold border">Status</th>
                    <th className="text-left p-3 font-semibold border ">Conversation</th>
                                                    <th className="text-left p-3 font-semibold text-gray-700">Agent</th> {/* Fixed width */}

                    <th className="text-left p-3 font-semibold border">Date</th>
                    <th className="text-left p-3 font-semibold border w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-500 border">
                        {loading ? 'Loading...' : 'No call descriptions found'}
                        <div className="mt-2 text-sm text-gray-400">
                          {!loading && 'Try refreshing or check if data exists in database'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((call) => (
                      <tr key={call._id} className="border-b hover:bg-gray-50">
                        <td className="p-3 border">
                          <span className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                            {call.sourceNumber}
                          </span>
                        </td>
                        <td className="p-3 border">
                          <span className="font-mono text-sm bg-purple-50 px-2 py-1 rounded">
                            {call.destination}
                          </span>
                        </td>
                        <td className="p-3 font-medium border">{call.callDuration}</td>
                        <td className="p-3 border">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </td>
                        <td className="p-3 relative group border">
                          <div className="truncate cursor-help text-sm max-w-24">
                            {call.callConversation}
                          </div>
                          {call.callConversation.length > 20 && (
                            <div className="absolute left-0 top-full w-80 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-40 overflow-y-auto">
                              <div className="break-words">{call.callConversation}</div>
                              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                            </div>
                          )}
                        </td>
                                                <td className="p-3 text-sm border">{call.user || " - "}</td>

                        <td className="p-3 text-sm border">{call.date}</td>
                        
                        <td className="p-3 border">
                          <button
                            onClick={() => deleteItem(call._id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CallDescriptionsTable;
