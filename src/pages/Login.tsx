import { useState } from "react";
import { loginApi } from "../lib/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await loginApi({ email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/home");
    } catch (err: any) {
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    // 🔴 OUTER WRAPPER (FULL SCREEN)
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      
      {/* CARD */}
      <div className="w-[900px] h-[500px] grid grid-cols-2 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(255,0,0,0.25)]">

        {/* LEFT — THEME SIDE */}
        <div className="bg-gradient-to-br from-red-700 via-red-900 to-black p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-bold tracking-widest">CESA CodeArena</h1>
          <p className="mt-4 text-sm text-red-200">
            Enter the Upside Down.<br />
            Prove your coding skills.
          </p>
        </div>

        {/* RIGHT — FORM */}
        <div className="bg-zinc-950 p-10 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-6">Sign In</h2>

          <input
            className="mb-3 p-3 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-red-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="mb-4 p-3 bg-zinc-900 border border-zinc-700 rounded focus:outline-none focus:border-red-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={handleLogin}
            className="bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
          >
            Login
          </button>

          <p className="text-sm text-zinc-400 mt-4">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-red-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

