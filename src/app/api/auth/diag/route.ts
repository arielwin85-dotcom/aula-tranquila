import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'aula2025diag') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const results: any = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    },
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) + '...',
    tests: {}
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!url || !serviceKey) {
      results.tests.adminClient = 'FAILED: Missing env vars';
    } else {
      const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Test 1: List users
      try {
        const { data: users, error } = await adminClient.auth.admin.listUsers();
        if (error) {
          results.tests.listUsers = `ERROR: ${error.message}`;
        } else {
          results.tests.listUsers = `OK - Found ${users?.users?.length ?? 0} users`;
          const adminUser = users?.users?.find((u: any) => u.email === 'admin@aulapro.com');
          results.tests.adminUserExists = adminUser 
            ? `FOUND - ID: ${adminUser.id}, confirmed: ${adminUser.email_confirmed_at ? 'YES' : 'NO'}`
            : 'NOT FOUND - user does not exist in auth.users';
        }
      } catch (e: any) {
        results.tests.listUsers = `EXCEPTION: ${e.message}`;
      }

      // Test 2: Check profiles table
      try {
        const { data: profiles, error } = await adminClient
          .from('profiles')
          .select('id, email, role')
          .eq('email', 'admin@aulapro.com');
        
        if (error) {
          results.tests.profileCheck = `ERROR: ${error.message}`;
        } else {
          results.tests.profileCheck = profiles?.length 
            ? `FOUND - ${JSON.stringify(profiles[0])}`
            : 'NOT FOUND - no row in profiles table';
        }
      } catch (e: any) {
        results.tests.profileCheck = `EXCEPTION: ${e.message}`;
      }

      // Test 3: Try to sign in with the credentials
      try {
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const anonClient = createClient(url, anonKey);
        const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
          email: 'admin@aulapro.com',
          password: 'admin123'
        });
        if (signInError) {
          results.tests.signIn = `FAILED: ${signInError.message}`;
        } else {
          results.tests.signIn = `SUCCESS - User: ${signInData.user?.id}`;
        }
      } catch (e: any) {
        results.tests.signIn = `EXCEPTION: ${e.message}`;
      }
    }
  } catch (e: any) {
    results.tests.general = `GENERAL ERROR: ${e.message}`;
  }

  return NextResponse.json(results);
}
