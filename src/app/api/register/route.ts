import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { UserAttributes } from '@supabase/supabase-js' // Import UserAttributes type

// Interface for the request body
interface RegisterRequestBody {
    email?: string;
    password?: string;
    username?: string;
}

// Interface for the Profile data to be inserted
interface ProfileInsert {
    id: string;
    username: string;
    email: string;
    role: string; // Assuming 'user' is the default role
    created_at: string;
}

export async function POST(request: NextRequest) {
    try {
        const { email, password, username }: RegisterRequestBody = await request.json();

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: "Email, password, and username are required" }, // English for consistency
                { status: 400 }
            );
        }

        // Basic validation
        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }
        if (username.length < 3) {
            return NextResponse.json(
                { error: "Username must be at least 3 characters long" },
                { status: 400 }
            );
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
             return NextResponse.json(
                { error: "Username can only contain letters, numbers, and underscores" },
                { status: 400 }
            );
        }

        // Create Supabase client using the SERVICE ROLE KEY for admin actions
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
        );

        // 1. Check if username already exists
        const { data: existingUsers, error: usernameError } = await supabase
            .from("profiles")
            .select("username")
            .eq("username", username)
            .maybeSingle(); // Use maybeSingle() to avoid error if no user found

        if (usernameError) {
            console.error("Error checking username:", usernameError);
            return NextResponse.json(
                { error: "Error checking username availability" },
                { status: 500 }
            );
        }

        if (existingUsers) {
            return NextResponse.json(
                { error: "Username already in use" },
                { status: 409 } // 409 Conflict is more appropriate
            );
        }

        // 2. Create user using Supabase Admin Auth API
        const userAttributes: UserAttributes = {
                email,
                password,
            };

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            ...userAttributes,
            email_confirm: true,
            user_metadata: { username }
        });

        if (authError) {
            console.error("Error creating Supabase auth user:", authError);
            // Check for specific errors like email already exists
            if (authError.message.includes("already registered")) {
                return NextResponse.json(
                    { error: "Email already registered" },
                    { status: 409 } // 409 Conflict
                );
            }
            return NextResponse.json(
                { error: "Failed to create user account", details: authError.message },
                { status: 500 }
            );
        }

        if (!authData?.user) {
            console.error("User creation via admin API did not return user data.");
            return NextResponse.json(
                { error: "Failed to create user account" },
                { status: 500 }
            );
        }

        // 3. Insert profile into the profiles table
        const profileData: ProfileInsert = {
            id: authData.user.id,
            username,
            email,
            role: "user", // Default role
            created_at: new Date().toISOString(),
        }

        const { error: profileError } = await supabase
            .from("profiles")
            .insert(profileData);

        if (profileError) {
            console.error("Error creating user profile:", profileError);
            // IMPORTANT: User auth exists, but profile failed. Need cleanup or manual fix.
            // Optionally, try to delete the auth user created in the previous step
            try {
                await supabase.auth.admin.deleteUser(authData.user.id);
                console.log(`Cleaned up auth user ${authData.user.id} after profile creation failure.`);
            } catch (cleanupError) {
                 console.error(`Failed to cleanup auth user ${authData.user.id}:`, cleanupError);
            }

            return NextResponse.json(
                { error: "Failed to create user profile", details: profileError.message },
                { status: 500 }
            );
        }

        // Success
        console.log(`User registered successfully: ${username} (${email})`);
        return NextResponse.json(
            {
                success: true,
                message: "Account created successfully!", // English
                user: {
                    id: authData.user.id,
                    email: authData.user.email,
                    username: username,
                },
            },
            { status: 201 } // 201 Created
        );

    } catch (error: any) {
        console.error("API Error (Register POST):", error);
         // Check for JSON parsing error
        if (error instanceof SyntaxError) {
             return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
} 