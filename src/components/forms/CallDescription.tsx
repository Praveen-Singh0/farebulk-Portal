import React, { useState } from 'react';
import { Phone, X } from 'lucide-react';
import axios from 'axios';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/use-auth';


interface CallFormData {
  sourceNumber: string;
  destination: string;
  callDuration: string;
  status: string;
  callConversation: string;
  date: string;
  user?: string;
}

const CallDescriptionPopup: React.FC = () => {

    const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CallFormData>({
    sourceNumber: '',
    destination: '',
    callDuration: '',
    status: 'Answered',
    callConversation: '',
    date: '',
    user: user?.userName || ''
  });

  // Get current date in DD/MM/YYYY format
  const getCurrentDate = (): string => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };



  // In your React component, update the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    // Add current date to form data for API request
    const apiData = {
      ...formData,
      date: getCurrentDate()
    };

    await axios.post(`${import.meta.env.VITE_BASE_URL}/callDescription`, {
      apiData
    });
    
    toast({
      title: "Call description submitted successfully",
      description: `Call logged for ${apiData.sourceNumber}`,
      className: "bg-green-500 border border-green-200",
    });
    
    // Reset form
    setFormData({
      sourceNumber: '',
      destination: '',
      callDuration: '',
      status: 'Answered',
      callConversation: '',
      date: ''
    });
    setIsOpen(false);
    
  } catch (error) {
    console.error('Error submitting call description:', error);
    toast({
      title: "Error submitting call description",
      description: "Something went wrong",
      className: "bg-red-500 border border-red-200",
    });
  }
};


  const handleInputChange = (field: keyof CallFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle source number with digit validation
  const handleSourceNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 12) { // Limit to 12 digits
      handleInputChange('sourceNumber', value);
    }
  };

  // Auto-resize textarea based on content
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    handleInputChange('callConversation', textarea.value);
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to expand as needed
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Bubble Popup */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 mb-2 animate-in slide-in-from-bottom-5 duration-300">
          {/* Bubble Container */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Call Description</h3>
                    <p className="text-blue-100 text-sm">Fill out call details</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-blue-100 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="p-6 max-h-full overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Source Number with validation */}
                <div className="space-y-2">
                  <label htmlFor="sourceNumber" className="block text-sm font-medium text-gray-700">
                    Source Number * <span className="text-xs text-gray-500">(Max 12 digits)</span>
                  </label>
                  <input
                    id="sourceNumber"
                    type="text"
                    value={formData.sourceNumber}
                    onChange={handleSourceNumberChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter source number"
                    minLength={10}
                    maxLength={12}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {formData.sourceNumber.length}/12 digits
                    {formData.sourceNumber.length > 0 && formData.sourceNumber.length < 10 && 
                      <span className="text-red-500 ml-2">Minimum 10 digits required</span>
                    }
                  </p>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                    Destination *
                  </label>
                  <input
                    id="destination"
                    type="text"
                    value={formData.destination}
                    onChange={(e) => handleInputChange('destination', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter destination"
                    required
                  />
                </div>

                {/* Call Duration */}
                <div className="space-y-2">
                  <label htmlFor="callDuration" className="block text-sm font-medium text-gray-700">
                    Call Duration *
                  </label>
                  <input
                    id="callDuration"
                    type="text"
                    value={formData.callDuration}
                    onChange={(e) => handleInputChange('callDuration', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 05:30 or 5 minutes"
                    required
                  />
                </div>

                {/* Call Conversation - Auto-expanding textarea */}
                <div className="space-y-2">
                  <label htmlFor="callConversation" className="block text-sm font-medium text-gray-700">
                    Call Conversation *
                  </label>
                  <textarea
                    id="callConversation"
                    value={formData.callConversation}
                    onChange={handleTextareaChange}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none overflow-hidden min-h-[42px]"
                    placeholder="Describe the call conversation in detail..."
                    rows={1}
                    required
                    style={{ height: 'auto' }}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.callConversation.length} characters
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={formData.sourceNumber.length < 10}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Submit Call Description
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Speech Bubble Arrow */}
          <div className="absolute -bottom-2 right-8">
            <div className="w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Floating Call Icon Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95 ${
            isOpen ? 'rotate-0' : 'hover:rotate-6'
          }`}
        >
          <Phone size={24} className={`transition-transform duration-300 ${isOpen ? 'rotate-12' : ''}`} />
          
          {/* Notification Dot */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Call Description
              <div className="absolute top-full right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>

      {/* Background Overlay for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 -z-10 sm:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default CallDescriptionPopup;