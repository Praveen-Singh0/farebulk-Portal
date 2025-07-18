import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, } from "lucide-react";


interface TravelConsultantFormData {
  date: string;
  time: string;
  airlineCode: string;
  confirmationCode: string;
  ticketCost: string;
  mco: string;
  paymentMethod: string;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
  Desc: string;
  ticketType: string;
  requestFor: string;
  status: string;
  billingFirstName: string;
  billingLastName: string;
  billingPhone: string;
  billingEmail: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingZipCode: string;
  billingCountry: string;
}

const TravelConsultantForm = ({ user }: { user: { email: string; role: string; userName?: string } }) => {
  const { toast } = useToast();

  const navigate = useNavigate();


  const getTodayDateEST = () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York', // New York time zone
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // e.g., "2025-06-26"
  };



  const getCurrentTimeEST = () => {
    const estDate = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
    });
    const date = new Date(estDate);
    return date.toTimeString().slice(0, 5); // returns "HH:mm"
  };



  const initialFormData: TravelConsultantFormData = {
    date: getTodayDateEST(),
    time: getCurrentTimeEST(),
    airlineCode: '',
    confirmationCode: '',
    ticketCost: '',
    mco: '',
    paymentMethod: 'credit',
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
    Desc: '',
    ticketType: '',
    requestFor: '',
    status: 'Pending',
    billingFirstName: '',
    billingLastName: '',
    billingPhone: '',
    billingEmail: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: ''
  };

  const [formData, setFormData] = useState<TravelConsultantFormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;

    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setFormData({ ...formData, cardNumber: formatted });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setFormData({ ...formData, expiryDate: formatted });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, '').length <= 10) {
      setFormData({ ...formData, billingPhone: formatted });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setFormData({ ...formData, cvv: value });
    }
  };

  const validateForm = () => {
    const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');

    if (cardNumberDigits.length < 13 || cardNumberDigits.length > 16) {
      toast({
        title: "Invalid Card Number",
        description: "Card number must be between 13-16 digits",
        variant: "destructive"
      });
      return false;
    }

    if (formData.expiryDate.length !== 5) {
      toast({
        title: "Invalid Expiry Date",
        description: "Please enter expiry date in MM/YY format",
        variant: "destructive"
      });
      return false;
    }

    if (formData.cvv.length < 3) {
      toast({
        title: "Invalid CVV",
        description: "CVV must be at least 3 digits",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.ticketType) {
      toast({
        title: "Ticket Type Required",
        description: "Please select a ticket type",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.requestFor) {
      toast({
        title: "Request For Required",
        description: "Please select what the ticket is for",
        variant: "destructive"
      });
      return false;
    }

    // Validate billing information
    if (!formData.billingFirstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter first name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingLastName.trim()) {
      toast({
        title: "Last Name Required",
        description: "Please enter last name",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter email address",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingPhone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter phone number",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingAddress.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter address",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingCity.trim()) {
      toast({
        title: "City Required",
        description: "Please enter city",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingState.trim()) {
      toast({
        title: "State Required",
        description: "Please enter state",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.billingZipCode.trim()) {
      toast({
        title: "Zip Code Required",
        description: "Please enter zip code",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      consultant: user.userName,
      datetime: `${formData.date} ${formData.time}`,
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      billingPhone: formData.billingPhone.replace(/\D/g, ''),
      // Create legacy fields for backward compatibility
      passengerName: `${formData.billingFirstName} ${formData.billingLastName}`,
      passengerEmail: formData.billingEmail,
      phoneNumber: formData.billingPhone.replace(/\D/g, ''),
    };

    console.log("submissionData...", submissionData) 

    setLoading(true)
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/ticket-requests`, submissionData, {
        withCredentials: true,
      });

      console.log('Saved successfully:', response);

      toast({
        title: 'Form submitted successfully',
        description: 'Your travel consultant billing request has been submitted',
      });

      setFormData(initialFormData);
      navigate('/dashboard/submissions')

    } catch (error) {
      console.error('Error submitting form:', error);

      toast({
        title: 'Submission failed',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          {/* New Ticket Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="ticketType">Ticket Type *</Label>
            <select
              id="ticketType"
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select Ticket Type</option>
              <option value="Hotel">Hotel</option>
              <option value="Amtrack">Amtrack</option>
              <option value="Car Rental">Car Rental</option>
              <option value="Airline">Airline</option>
            </select>
          </div>

          {/* New Request For Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="requestFor">Request For *</Label>
            <select
              id="requestFor"
              value={formData.requestFor}
              onChange={(e) => setFormData({ ...formData, requestFor: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Select Request For</option>
              <option value="New booking">New booking</option>
              <option value="Cancellation">Cancellation</option>
              <option value="Changes">Changes</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingFirstName">First Name *</Label>
            <Input
              id="billingFirstName"
              value={formData.billingFirstName}
              onChange={(e) => setFormData({ ...formData, billingFirstName: e.target.value })}
              placeholder="John"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingLastName">Last Name *</Label>
            <Input
              id="billingLastName"
              value={formData.billingLastName}
              onChange={(e) => setFormData({ ...formData, billingLastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingPhone">Phone *</Label>
            <Input
              id="billingPhone"
              type="tel"
              value={formData.billingPhone}
              onChange={handlePhoneChange}
              placeholder="(123) 456-7890"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billingEmail">Email *</Label>
            <Input
              id="billingEmail"
              type="email"
              value={formData.billingEmail}
              onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
              placeholder="john.doe@example.com"
              required
            />
          </div>


          {formData.ticketType === 'Airline' && (
            <div className="space-y-2">
              <Label htmlFor="airlineCode">Airlines Code</Label>
              <Input
                id="airlineCode"
                value={formData.airlineCode}
                onChange={(e) => setFormData({ ...formData, airlineCode: e.target.value })}
                placeholder="e.g., QR"
              />
            </div>
          )}


          <div className="space-y-2">
            <Label htmlFor="confirmationCode">Confirmation Code *</Label>
            <Input
              id="confirmationCode"
              value={formData.confirmationCode}
              onChange={(e) => setFormData({ ...formData, confirmationCode: e.target.value.toUpperCase() })}
              placeholder="Enter booking confirmation"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketCost">Ticket Cost (USD) *</Label>
            <Input
              id="ticketCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.ticketCost}
              onChange={(e) => setFormData({ ...formData, ticketCost: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mco">MCO (USD) *</Label>
            <Input
              id="mco"
              type="number"
              step="0.01"
              min="0"
              value={formData.mco}
              onChange={(e) => setFormData({ ...formData, mco: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
        </div>

  {/* Customer Billing Information Section */}
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Customer Billing Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="billingAddress">Address *</Label>
              <Input
                id="billingAddress"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                placeholder="123 Main Street, Apt 4B"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCity">City *</Label>
              <Input
                id="billingCity"
                value={formData.billingCity}
                onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                placeholder="New York"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingState">State *</Label>
              <Input
                id="billingState"
                value={formData.billingState}
                onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                placeholder="NY"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingZipCode">Zip Code *</Label>
              <Input
                id="billingZipCode"
                value={formData.billingZipCode}
                onChange={(e) => setFormData({ ...formData, billingZipCode: e.target.value })}
                placeholder="10001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingState">Country *</Label>
              <Input
                id="billingState"
                value={formData.billingCountry}
                onChange={(e) => setFormData({ ...formData, billingCountry: e.target.value })}
                placeholder="United State"
                required
              />
            </div>
          </div>
        </div>

        {/* Payment Details Section */}
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-4">Payment Details</h3>

          <div className="mb-6">
            <Label className="mb-3 block font-medium">Payment Method *</Label>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="credit"
                  name="paymentMethod"
                  value="credit"
                  checked={formData.paymentMethod === 'credit'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="h-4 w-4"
                />
                <Label htmlFor="credit" className="cursor-pointer">Credit Card</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="debit"
                  name="paymentMethod"
                  value="debit"
                  checked={formData.paymentMethod === 'debit'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="h-4 w-4"
                />
                <Label htmlFor="debit" className="cursor-pointer">Debit Card</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                value={formData.cardholderName}
                onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value.toUpperCase() })}
                placeholder="JOHN DOE"
                style={{ textTransform: 'uppercase' }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number *</Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
              <p className="text-xs text-gray-500">Enter 13-16 digit card number</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={handleExpiryChange}
                maxLength={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                type="password"
                maxLength={4}
                value={formData.cvv}
                onChange={handleCvvChange}
                placeholder="123"
                required
              />
              <p className="text-xs text-gray-500">3-4 digit security code</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="Desc">Description *</Label>
            <Input
              id="Desc"
              type="text"
              value={formData.Desc}
              onChange={(e) => setFormData({ ...formData, Desc: e.target.value })}
              placeholder="Decribe in detail.."
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-zinc-900 hover:bg-blue-700">
          {loading ? (
            <>
              <RefreshCw className="animate-spin text-white-500" />
              <span className="ml-2">Submitting your request...</span>
            </>
          ) : (
            "Submit Billing Request"
          )}
        </Button>
      </form>
    </div>
  );
};

export default TravelConsultantForm;