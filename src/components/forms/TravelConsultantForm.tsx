import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';

interface TravelConsultantFormData {
  date: string;
  passengerName: string;
  airlinesName: string;
  confirmationCode: string;
  passengerEmail: string;
  phoneNumber: string;
  ticketCost: string;
  mco: string;
  paymentMethod: string;
  cardNumber: string;
  cardholderName: string;
  expiryDate: string;
  cvv: string;
}

const TravelConsultantForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TravelConsultantFormData>({
    date: '',
    passengerName: '',
    airlinesName: '',
    confirmationCode: '',
    passengerEmail: '',
    phoneNumber: '',
    ticketCost: '',
    mco: '',
    paymentMethod: 'debit', // Default to debit
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log all form data to console
    console.log("Form Data:", formData);
    
    // Add form submission logic here
    toast({
      title: "Form submitted",
      description: "Your travel consultant form has been submitted successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passengerName">Passenger Name</Label>
          <Input
            id="passengerName"
            value={formData.passengerName}
            onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="airlinesName">Airlines Name</Label>
          <Input
            id="airlinesName"
            value={formData.airlinesName}
            onChange={(e) => setFormData({ ...formData, airlinesName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmationCode">Confirmation Code</Label>
          <Input
            id="confirmationCode"
            value={formData.confirmationCode}
            onChange={(e) => setFormData({ ...formData, confirmationCode: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passengerEmail">Passenger Email</Label>
          <Input
            id="passengerEmail"
            type="email"
            value={formData.passengerEmail}
            onChange={(e) => setFormData({ ...formData, passengerEmail: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticketCost">Ticket Cost (USD)</Label>
          <Input
            id="ticketCost"
            type="number"
            step="0.01"
            value={formData.ticketCost}
            onChange={(e) => setFormData({ ...formData, ticketCost: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mco">MCO (USD)</Label>
          <Input
            id="mco"
            type="number"
            step="0.01"
            value={formData.mco}
            onChange={(e) => setFormData({ ...formData, mco: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Payment Details Section */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Payment Details</h3>
        
        <div className="mb-4">
          {/* <Label className="mb-2 block">Payment Method</Label> */}
          <div className="flex space-x-4">
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
              <Label htmlFor="debit">Debit Card</Label>
            </div>
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
              <Label htmlFor="credit">Credit Card</Label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={formData.cardholderName}
              onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                maxLength={4}
                value={formData.cvv}
                onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Submit Form
      </Button>
    </form>
  );
};

export default TravelConsultantForm;