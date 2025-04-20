import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Interface for the request body
interface CommentRequestBody {
    text: string;
    authorId: string;
    storyId?: string;
    seriesId?: string;
    chapterId?: string;
    parentId?: string;
}

// Interface for comment data to be inserted
interface CommentInsertData {
    text: string;
    author_id: string;
    parent_id?: string | null;
    story_id?: string;
    series_id?: string;
    chapter_id?: string;
    created_at: string;
}

// Interface for the comment data returned
interface CommentResponse {
    id: string;
    text: string;
    author_id: string;
    parent_id: string | null;
    story_id: string | null;
    series_id: string | null;
    chapter_id: string | null;
    created_at: string;
    // Potentially add profile info here if needed in response
}

// Interface for Notification Insert Data
interface NotificationInsertData {
    user_id: string;          // ID of the user receiving the notification
    type: 'comment' | 'reply'; // Type of notification
    content: string;          // Text content of the notification
    related_id?: string;       // ID of the comment that triggered the notification
    link?: string;             // Optional link (e.g., to the story/chapter)
    is_read: boolean;
    created_at: string;
    actor_id?: string;         // ID of the user who made the comment (optional but good)
    story_id?: string;
    series_id?: string;
    chapter_id?: string;
}


export async function POST(request: NextRequest) {
    try {
        // Create Supabase client with Service Role Key
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get request body
        const {
            text,
            authorId,
            storyId,
            seriesId,
            chapterId,
            parentId,
        }: CommentRequestBody = await request.json();

        // --- Validation ---
        if (!text || !text.trim()) {
            return NextResponse.json(
                { error: "Comment text is required" },
                { status: 400 }
            );
        }

        if (!authorId) {
            return NextResponse.json(
                { error: "Author ID is required" },
                { status: 400 }
            );
        }

        // Must have one of storyId, seriesId, or chapterId
        if (!storyId && !seriesId && !chapterId) {
            return NextResponse.json(
                { error: "storyId, seriesId, or chapterId must be provided" },
                { status: 400 }
            );
        }

        // Check if the author (profile) exists
        const { data: userExists, error: userError } = await supabase
            .from("profiles")
            .select("id, username") // Select username for notifications
            .eq("id", authorId)
            .single();

        if (userError || !userExists) {
            console.error("Error verifying author:", userError);
            return NextResponse.json(
                { error: "Author not found" },
                { status: 404 }
            );
        }
        const authorUsername = userExists.username || "Someone";

        // Check if parent comment exists (if it's a reply)
        if (parentId) {
            const { data: parentExists, error: parentError } = await supabase
                .from("comments")
                .select("id")
                .eq("id", parentId)
                .maybeSingle(); // Use maybeSingle to handle null case gracefully

            if (parentError) {
                 console.error("Error verifying parent comment:", parentError);
                 return NextResponse.json(
                    { error: "Error verifying parent comment" },
                    { status: 500 }
                );
            }
            if (!parentExists) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 }
                );
            }
        }

        // --- Content Verification & Notification Prep ---
        let contentAuthorId: string | null = null;
        let contentTitle: string = "";
        let contentType: 'story' | 'series' | 'chapter' | null = null;
        let link: string | undefined = undefined;

        // Verify story/series/chapter exists and get author ID + title
        if (storyId) {
            const { data: storyData, error: storyError } = await supabase
                .from("stories")
                .select("id, title, author_id")
                .eq("id", storyId)
                .single();
            if (storyError || !storyData) {
                return NextResponse.json({ error: "Story not found" }, { status: 404 });
            }
            contentAuthorId = storyData.author_id;
            contentTitle = storyData.title;
            contentType = "story";
            link = `/story/${storyId}`;
        } else if (seriesId) {
            const { data: seriesData, error: seriesError } = await supabase
                .from("series")
                .select("id, title, author_id")
                .eq("id", seriesId)
                .single();
            if (seriesError || !seriesData) {
                return NextResponse.json({ error: "Series not found" }, { status: 404 });
            }
            contentAuthorId = seriesData.author_id;
            contentTitle = seriesData.title;
            contentType = "series";
             link = `/obra/${seriesId}`; // Assuming /obra/[id] is the series page
        } else if (chapterId) {
            const { data: chapterData, error: chapterError } = await supabase
                .from("chapters")
                .select("id, title, author_id, series_id")
                .eq("id", chapterId)
                .single();
            if (chapterError || !chapterData) {
                return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
            }
            contentAuthorId = chapterData.author_id;
            contentTitle = chapterData.title;
            contentType = "chapter";
            link = `/ler/${chapterData.series_id}/${chapterId}`; // Assuming /ler/[series_id]/[chapter_id]

            // Add series title prefix if part of a series
            if (chapterData.series_id) {
                const { data: seriesData } = await supabase
                    .from("series")
                    .select("title")
                    .eq("id", chapterData.series_id)
                    .single();
                if (seriesData) {
                    contentTitle = `${seriesData.title} - Cap. ${contentTitle}`;
                }
            }
        }

        // --- Insert Comment ---
        const commentData: CommentInsertData = {
            text,
            author_id: authorId,
            parent_id: parentId || null,
            story_id: storyId,
            series_id: seriesId,
            chapter_id: chapterId,
            created_at: new Date().toISOString(),
        };

        const { data: newComment, error: insertError } = await supabase
            .from("comments")
            .insert(commentData)
            .select()
            .single();

        if (insertError || !newComment) {
            console.error("Error inserting comment:", insertError);
            return NextResponse.json(
                { error: "Error creating comment", details: insertError?.message },
                { status: 500 }
            );
        }

        // --- Send Notification (if applicable) ---
        if (contentAuthorId && contentAuthorId !== authorId && contentType) {
            const notificationType = parentId ? 'reply' : 'comment';
            let notificationContent = `${authorUsername} commented on your ${contentType} "${contentTitle}"`;
            if (notificationType === 'reply') {
                notificationContent = `${authorUsername} replied to your comment on "${contentTitle}"`; // Adjust if replying to comment vs content
            }

            const notification: NotificationInsertData = {
                user_id: contentAuthorId,
                type: notificationType,
                content: notificationContent,
                link: link,
                related_id: newComment.id, // ID of the new comment
                actor_id: authorId, // User who performed the action
                story_id: storyId,
                series_id: seriesId,
                chapter_id: chapterId,
                is_read: false,
                created_at: new Date().toISOString(),
            };

            const { error: notificationError } = await supabase
                .from("notifications")
                .insert(notification);

            if (notificationError) {
                // Log error but don't fail the comment creation
                console.error("Failed to create notification:", notificationError);
            }
        }

        // --- Success Response ---
        return NextResponse.json(
            {
                message: "Comment added successfully",
                comment: newComment as CommentResponse, // Cast to defined response type
            },
            { status: 201 }
        );

    } catch (error: any) {
        console.error("API Error (Comments POST):", error);
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

// Potential DELETE endpoint
// export async function DELETE(request: NextRequest) { ... }

// Potential GET endpoint (e.g., fetch comments for a story/chapter)
// export async function GET(request: NextRequest) { ... } 