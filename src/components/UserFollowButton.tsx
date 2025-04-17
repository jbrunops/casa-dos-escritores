"use client";
import { useState, useTransition } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface UserFollowButtonProps {
  profileId: string;
  isFollowing: boolean;
  username: string;
}

export default function UserFollowButton({ profileId, isFollowing, username }: UserFollowButtonProps) {
  // ...restante igual, com tipagem.
}
