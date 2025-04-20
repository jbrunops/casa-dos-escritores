import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Interface for request body
interface DeleteUserRequestBody {
    userId?: string;
}

export async function POST(request: NextRequest) {
    // WARNING: This endpoint allows deleting any user if called with the correct secret.
    // In a real application, ADD STRONG AUTHENTICATION/AUTHORIZATION HERE.
    // For example, check if the request comes from an authenticated admin user.

    try {
        const { userId }: DeleteUserRequestBody = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: "User ID not provided" }, // English
                { status: 400 }
            );
        }

        // Create Supabase client with Service Role Key for admin operations
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key!
        );

        // Delete the user from Supabase Auth
        const { data, error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error(`Error deleting user ${userId} from authentication:`, error);
            // Check if the user was already deleted or not found
            if (error.message.includes("User not found")) {
                 return NextResponse.json({ error: "User not found" }, { status: 404 });
            }
            return NextResponse.json(
                { error: "Failed to delete user from authentication", details: error.message },
                { status: 500 }
            );
        }

        console.log(`User ${userId} deleted from authentication successfully.`);
        return NextResponse.json(
            {
                success: true,
                message: "User deleted successfully",
            },
            { status: 200 }
        );

    } catch (error: any) {
        console.error("API Error (Admin Delete User POST):", error);
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