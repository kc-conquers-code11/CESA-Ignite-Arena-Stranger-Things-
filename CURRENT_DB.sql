-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text,
  details jsonb,
  severity text DEFAULT 'info'::text,
  timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.competition_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'Shield'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT competition_rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exam_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text,
  first_name text,
  last_name text,
  class text,
  division text,
  branch text,
  status text DEFAULT 'active'::text,
  current_round_slug text DEFAULT 'rules'::text,
  tab_switches integer DEFAULT 0,
  started_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT exam_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.executions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  language text,
  code text,
  status text,
  score integer,
  stdout text,
  stderr text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT executions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.flowchart_problems (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  requirements jsonb NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flowchart_problems_pkey PRIMARY KEY (id)
);
CREATE TABLE public.flowchart_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  problem_id text NOT NULL,
  nodes jsonb,
  edges jsonb,
  ai_score integer,
  ai_feedback text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  miro_board_url text,
  CONSTRAINT flowchart_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT flowchart_submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  round1_score integer DEFAULT 0,
  round2_score integer DEFAULT 0,
  round3_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leaderboard_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  competition_status text DEFAULT 'active'::text,
  current_round text DEFAULT 'rules'::text,
  tab_switch_count integer DEFAULT 0,
  score integer DEFAULT 0,
  last_active timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text,
  code_snippet text,
  options jsonb,
  correct_answer text,
  points integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  round_id text NOT NULL DEFAULT 'mcq'::text,
  title text,
  description text,
  examples jsonb,
  constraints jsonb,
  difficulty text DEFAULT 'medium'::text,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rounds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  sequence_order integer NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT rounds_pkey PRIMARY KEY (id)
);
CREATE TABLE public.security_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  action_type text,
  details text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT security_logs_pkey PRIMARY KEY (id),
  CONSTRAINT security_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question_id uuid NOT NULL,
  answer_text text,
  is_correct boolean,
  submitted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT submissions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);