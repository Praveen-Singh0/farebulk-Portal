import { useState } from "react";
import axios from "axios";
import { toast } from "../ui/use-toast";


const CreateTravelConsultantForm = ({
  selectedRole,
  onSuccess,
  fetchUsers,
}: {
  selectedRole: 'travel' | 'ticket';
  onSuccess: () => void;
  fetchUsers: () => void;
}) => {

  const [form, setForm] = useState({ name: '', email: '', password: '' });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL}/auth/register`, {
        userName: form.name,
        role: selectedRole,
        email: form.email,
        password: form.password,
      });

      console.log("res creating user :", res.data.user.userName)

      toast({
        title: "User created successfully",
        description: `Welcome, ${res.data.user.userName}`,
        className: "bg-green-500 border border-green-200",

      });
      onSuccess();
      setForm({ name: "", email: "", password: "" });
      fetchUsers()

    } catch (error: any) {
      toast({
        title: "Error creating user",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };


  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block font-medium mb-1">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Password</label>
        <input
          type="text"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-[#9B87F5] text-white py-2 rounded font-semibold"
      >
        Create Travel Consultant
      </button>
    </form>
  );
};

export default CreateTravelConsultantForm;
