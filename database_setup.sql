-- =====================================================
-- Database Setup for Dynamic Questions System
-- Run these commands in Supabase SQL Editor
-- =====================================================

-- Step 1: Make content column nullable (since we're using title/description instead)
ALTER TABLE questions ALTER COLUMN content DROP NOT NULL;

-- Step 2: Drop the old UUID round_id and recreate as TEXT
ALTER TABLE questions DROP COLUMN IF EXISTS round_id;
ALTER TABLE questions ADD COLUMN round_id TEXT NOT NULL DEFAULT 'mcq';

-- Step 3: Add missing columns that don't exist yet
ALTER TABLE questions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS examples JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS constraints JSONB;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

-- Note: code_snippet, options, correct_answer already exist, so we skip those

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_round_id ON questions(round_id);

-- =====================================================
-- Optional: Sample Data for Testing
-- =====================================================

-- Sample MCQ Question
INSERT INTO questions (round_id, title, description, options, correct_answer, difficulty)
VALUES (
    'mcq',
    'What is the time complexity of binary search?',
    'Select the correct time complexity for binary search algorithm on a sorted array.',
    '["O(n)", "O(log n)", "O(n²)", "O(1)"]'::jsonb,
    'O(log n)',
    'easy'
);

-- Sample Coding Question
INSERT INTO questions (
    round_id, 
    title, 
    description, 
    code_snippet,
    examples,
    constraints,
    difficulty
)
VALUES (
    'coding',
    '1. Two Sum',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.',
    'class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass',
    '[
        {
            "input": "nums = [2,7,11,15], target = 9",
            "output": "[0,1]",
            "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
        },
        {
            "input": "nums = [3,2,4], target = 6",
            "output": "[1,2]",
            "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."
        }
    ]'::jsonb,
    '[
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9",
        "-10^9 <= target <= 10^9"
    ]'::jsonb,
    'easy'
);

-- Sample Flowchart Problem (if not exists)
INSERT INTO flowchart_problems (title, description, requirements, is_active)
VALUES (
    'Find Largest of 3 Numbers',
    'Create a flowchart that takes three numbers as input (A, B, C) and prints the largest number among them.',
    '[
        "Input three numbers A, B, and C",
        "Compare the numbers using decision boxes",
        "Output the largest number",
        "Handle edge cases where numbers are equal"
    ]'::jsonb,
    true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check MCQ questions
SELECT id, round_id, title, difficulty 
FROM questions 
WHERE round_id = 'mcq'
ORDER BY created_at DESC;

-- Check Coding questions
SELECT id, round_id, title, difficulty 
FROM questions 
WHERE round_id = 'coding'
ORDER BY created_at DESC;

-- Check Flowchart problems
SELECT id, title, is_active 
FROM flowchart_problems 
ORDER BY created_at DESC;

-- =====================================================
-- Row Level Security (RLS) Policies
-- Ensure students can only read questions, admins can manage
-- =====================================================

-- Enable RLS on questions table
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read questions
CREATE POLICY "Anyone can read questions"
ON questions FOR SELECT
TO public
USING (true);

-- Policy: Only authenticated users can insert (admins through admin panel)
CREATE POLICY "Authenticated users can insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated users can update questions
CREATE POLICY "Authenticated users can update questions"
ON questions FOR UPDATE
TO authenticated
USING (true);

-- Policy: Only authenticated users can delete questions
CREATE POLICY "Authenticated users can delete questions"
ON questions FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- Enable RLS on flowchart_problems
-- =====================================================

ALTER TABLE flowchart_problems ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read flowchart problems
CREATE POLICY "Anyone can read flowchart problems"
ON flowchart_problems FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can manage flowchart problems
CREATE POLICY "Authenticated users can insert flowchart problems"
ON flowchart_problems FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update flowchart problems"
ON flowchart_problems FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete flowchart problems"
ON flowchart_problems FOR DELETE
TO authenticated
USING (true);
