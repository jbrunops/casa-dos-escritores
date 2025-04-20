import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Interface for Notification Data
interface NotificationData {
    user_id: string;
    type: string; // Could be an enum: 'comment', 'follow', 'system', etc.
    content: string;
    link?: string; // Optional link for navigation
    actor_id?: string; // User who triggered the notification (optional)
    story_id?: string; // Related story (optional)
    comment_id?: string; // Related comment (optional)
    read?: boolean; // Read status, defaulting to false in DB
}

export async function POST(request: NextRequest) {
    try {
        const notificationData: NotificationData = await request.json();

        // Basic Validation
        if (!notificationData.user_id || !notificationData.type || !notificationData.content) {
            return NextResponse.json(
                { error: "Missing required fields: user_id, type, content" }, // English
                { status: 400 }
            );
        }

        // Create Supabase client using the SERVICE ROLE KEY
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Prepare data for insertion (add timestamp, ensure boolean for read)
        const dataToInsert = {
            ...notificationData,
            read: notificationData.read ?? false, // Default read to false
            created_at: new Date().toISOString(),
        };

        // Insert notification
        const { data: newNotification, error } = await supabase
            .from("notifications")
            .insert(dataToInsert)
            .select()
            .single(); // Expecting a single object back

        if (error) {
            console.error("Error creating notification:", error);
            return NextResponse.json(
                { error: "Failed to create notification", details: error.message },
                { status: 500 }
            );
        }

        console.log(`Notification created successfully for user ${notificationData.user_id}`);
        return NextResponse.json(
            {
                success: true,
                notification: newNotification,
            },
            { status: 201 } // 201 Created
        );

    } catch (error: any) {
        console.error("API Error (Notifications POST):", error);
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

// Could add a GET endpoint to fetch notifications for a user
// export async function GET(request: NextRequest) { ... }

// Could add a PATCH endpoint to mark notifications as read
// export async function PATCH(request: NextRequest) { ... } 