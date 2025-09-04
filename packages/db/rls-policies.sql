-- Row Level Security (RLS) Policies for watchlist_items table
-- This file implements security policies to ensure users can only access their own watchlist data

-- Enable Row Level Security on watchlist_items table
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can only view their own watchlist items
-- This policy filters SELECT operations to only return rows where the userId matches the authenticated user's ID
CREATE POLICY "Enable users to view their own watchlist items" ON public.watchlist_items
    FOR SELECT 
    USING (auth.uid() = "userId");

-- Policy 2: INSERT - Users can only insert watchlist items for themselves
-- This policy validates that new watchlist items can only be created with the authenticated user's ID
CREATE POLICY "Enable users to insert their own watchlist items" ON public.watchlist_items
    FOR INSERT 
    WITH CHECK (auth.uid() = "userId");

-- Policy 3: UPDATE - Users can only update their own watchlist items
-- This policy restricts UPDATE operations to rows that belong to the authenticated user
CREATE POLICY "Enable users to update their own watchlist items" ON public.watchlist_items
    FOR UPDATE 
    USING (auth.uid() = "userId") 
    WITH CHECK (auth.uid() = "userId");

-- Policy 4: DELETE - Users can only delete their own watchlist items
-- This policy restricts DELETE operations to rows that belong to the authenticated user
CREATE POLICY "Enable users to delete their own watchlist items" ON public.watchlist_items
    FOR DELETE 
    USING (auth.uid() = "userId");

-- Note: These policies use auth.uid() which returns the currently authenticated user's ID from Supabase Auth
-- The "userId" field in watchlist_items corresponds to the User.id which matches auth.users.id
-- All policies enforce strict user isolation - users cannot perform any operations on other users' data