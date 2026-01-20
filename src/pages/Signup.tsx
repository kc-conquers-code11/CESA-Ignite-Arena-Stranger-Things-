import { useState } from "react";
import { signupApi } from "../lib/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    class: "",
    division: "",
    branch: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      await signupApi(form);
      alert("Signup successful. Login now.");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-[420px] p-8 rounded-xl border border-red-600
        bg-zinc-950 shadow-[0_0_40px_rgba(255,0,0,0.35)]">

        <h2 className="text-2xl font-bold text-center mb-6 tracking-widest">
          CREATE ACCOUNT
        </h2>

        {/* First + Last name */}
        <div className="flex gap-3 mb-3">
          <input
            name="firstName"
            placeholder="First Name"
            className="w-1/2 input"
            onChange={handleChange}
          />
          <input
            name="lastName"
            placeholder="Last Name"
            className="w-1/2 input"
            onChange={handleChange}
          />
        </div>

        <input name="email" placeholder="Email" className="input mb-3" onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" className="input mb-4" onChange={handleChange} />

        {/* Dropdowns */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <select name="class" className="select" onChange={handleChange}>
            <option>FE</option><option>SE</option><option>TE</option><option>BE</option>
          </select>

          <select name="division" className="select" onChange={handleChange}>
            <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option>
          </select>

          <select name="branch" className="select" onChange={handleChange}>
            <option>COMPS</option>
            <option>IT</option>
            <option>AIML</option>
            <option>ELECTRONICS</option>
            <option>MECH</option>
          </select>
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-red-600 hover:bg-red-700 transition
            py-3 rounded-lg font-semibold tracking-wide">
          SIGN UP
        </button>

        <p className="text-center text-sm text-zinc-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-red-500 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
