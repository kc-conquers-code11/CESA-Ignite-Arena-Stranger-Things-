# Admin Question Management Integration Guide

## Database Schema Required

### questions table (already exists - needs round_id column)
```sql
ALTER TABLE questions ADD COLUMN IF NOT EXISTS round_id TEXT NOT NULL DEFAULT 'mcq';
```

The questions table should have:
- id (uuid)
- round_id (text) - 'mcq' or 'coding'
- title (text)
- description (text)  
- options (jsonb) - array of strings for MCQ
- correct_answer (text)
- difficulty (text)
- code_snippet (text) - for coding problems
- examples (jsonb) - for coding problems
- constraints (jsonb) - for coding problems
- created_at (timestamp)

## Changes Needed:

### 1. Update MCQRound.tsx to fetch from database
### 2. Update CodingRound.tsx to fetch from database
### 3. Update AdminPanel to have proper forms for both MCQ and Coding
