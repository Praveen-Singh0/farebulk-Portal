import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';

interface TicketConsultantFormData {
  totalCharge: string;
  arcCharge: string;
  finalMco: string;
  hkGk: string;
  status: string;
  agentName: string;
  remarks: string;
}

const TicketConsultantForm = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TicketConsultantFormData>({
    totalCharge: '',
    arcCharge: '',
    finalMco: '',
    hkGk: '',
    status: '',
    agentName: '',
    remarks: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add form submission logic here
    toast({
      title: "Form submitted",
      description: "Your ticket consultant form has been submitted successfully",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="totalCharge">Total Charge (USD)</Label>
          <Input
            id="totalCharge"
            type="number"
            step="0.01"
            value={formData.totalCharge}
            onChange={(e) => setFormData({ ...formData, totalCharge: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="arcCharge">ARC Charge (USD)</Label>
          <Input
            id="arcCharge"
            type="number"
            step="0.01"
            value={formData.arcCharge}
            onChange={(e) => setFormData({ ...formData, arcCharge: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalMco">Final MCO (USD)</Label>
          <Input
            id="finalMco"
            type="number"
            step="0.01"
            value={formData.finalMco}
            onChange={(e) => setFormData({ ...formData, finalMco: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hkGk">HK/GK</Label>
          <Select
            value={formData.hkGk}
            onValueChange={(value) => setFormData({ ...formData, hkGk: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select HK/GK" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HK">HK</SelectItem>
              <SelectItem value="GK">GK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="charged">Charged</SelectItem>
              <SelectItem value="not-charged">Not Charged</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agentName">Agent Name</Label>
          <Input
            id="agentName"
            value={formData.agentName}
            onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="remarks">Remarks</Label>
          <Input
            id="remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Add any additional comments here"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Submit Form
      </Button>
    </form>
  );
};

export default TicketConsultantForm; 