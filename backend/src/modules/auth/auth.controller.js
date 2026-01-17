import { supabase } from "../../config/supabaseClient.js";

export const signup = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Supabase Auth signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Store extra user data
    await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        role,
        name,
      },
    ]);

    return res.status(201).json({
      message: "Signup successful",
      userId: data.user.id,
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    // Fetch role from users table
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, role, name")
      .eq("id", data.user.id)
      .single();

    return res.status(200).json({
      message: "Login successful",
      session: data.session,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

