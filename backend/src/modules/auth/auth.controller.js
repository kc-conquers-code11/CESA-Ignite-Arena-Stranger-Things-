import { supabase } from "../../config/supabaseClient.js";

export const signup = async (req, res) => {
  console.log("SIGNUP BODY:", req.body);

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      class: userClass,
      division,
      branch,
    } = req.body;

    // 1️⃣ Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // 2️⃣ Insert profile
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        class: userClass,
        division,
        branch,
      });
      console.log("AUTH USER:", data?.user);


    if (profileError) {
      console.error("PROFILE INSERT ERROR:", profileError);
      return res.status(400).json({ error: profileError.message });
    }

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
  console.log("PROFILE INSERTED");


};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("PROFILE FETCH ERROR:", profileError);
      return res.status(404).json({ error: "User profile not found" });
    }

    res.json({
      message: "Login successful",
      user: profile,
      session: data.session,});
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
};

