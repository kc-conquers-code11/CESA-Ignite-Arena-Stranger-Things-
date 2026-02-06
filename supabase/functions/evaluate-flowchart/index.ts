import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS (Browser pre-flight check)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  
  try {
    // 2. Get Data from Request
    const { submission_id } = await req.json();
    if (!submission_id) throw new Error("Missing submission_id");

    // 3. Connect to Supabase
    // Service Role Key zaroori hai taaki RLS bypass karke data read/write sakein
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' 
    );

    // 4. Fetch the Submission Data
    const { data: record, error: fetchError } = await supabase
      .from('flowchart_submissions')
      .select('*, flowchart_problems(title, description, requirements)')
      .eq('id', submission_id)
      .single();

    if (fetchError || !record) {
      throw new Error(`Submission not found: ${fetchError?.message}`);
    }

    // 5. DATA CLEANING (React Flow Specific)
    // AI ko coordinates (x,y) aur styling se matlab nahi hai, sirf Logic chahiye.
    // Hum data ko chota kar rahe hain taaki AI confusion na ho aur tokens bachein.
    
    const nodes = record.nodes || [];
    const edges = record.edges || [];

    const simplifiedNodes = nodes.map((n: any) => ({
      id: n.id,
      type: n.type, // 'start', 'process', 'decision', 'end'
      text: n.data?.label || "Empty Node" // User ne kya likha hai
    }));

    const simplifiedEdges = edges.map((e: any) => ({
      from: e.source,
      to: e.target,
      label: e.label || "" // Agar connection par kuch likha hai (e.g. Yes/No)
    }));

    const problemContext = record.flowchart_problems;

    // 6. Call OpenAI
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) throw new Error("Server Error: OPENAI_API_KEY is missing");

    const prompt = `
      Act as a Senior Computer Science Professor. Evaluate this flowchart logic.
      
      PROBLEM STATEMENT:
      Title: "${problemContext?.title}"
      Description: "${problemContext?.description}"
      Requirements: ${JSON.stringify(problemContext?.requirements)}

      STUDENT'S FLOWCHART DATA:
      Nodes (Steps): ${JSON.stringify(simplifiedNodes)}
      Edges (Connections): ${JSON.stringify(simplifiedEdges)}

      EVALUATION RULES:
      1. Check if the flow logically solves the problem from 'start' to 'end'.
      2. Check if Decision nodes have valid branches (Yes/No logic).
      3. Give a Score (0-100) based on logic accuracy.
      4. Provide Constructive Feedback (Max 2 sentences).
      
      OUTPUT FORMAT (Strict JSON only):
      {
        "score": number,
        "feedback": "string"
      }
    `;

    console.log("Sending Prompt to AI..."); // Debugging log in Supabase Dashboard

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or 'gpt-3.5-turbo' (Fast & Cheap)
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2, // Low temperature for consistent grading
      }),
    });

    const aiData = await aiResponse.json();
    
    if (!aiData.choices) {
        console.error("OpenAI Error:", aiData);
        throw new Error("OpenAI API returned error");
    }

    // Parse AI Response
    const content = aiData.choices[0].message.content;
    // Kabhi kabhi AI markdown (```json ... ```) bhejta hai, usse clean karna padta hai
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanContent);

    // 7. Update Database with Score
    await supabase
      .from('flowchart_submissions')
      .update({
        ai_score: result.score,
        ai_feedback: result.feedback,
        status: 'graded'
      })
      .eq('id', submission_id);

    // 8. Return Success
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error("Function Error:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});