"use client";

import { StoryCard } from '../../components/StoryCard';
import { useStoryStore } from '../../lib/storyStore';

const DashboardPage = () => {
  const stories = useStoryStore((state) => state.stories);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Histórias</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;

    open: boolean;
    storyId: string | null;
    title: string;
}

export default function DashboardPage() {
    const [series, setSeries] = useState<Series[]>([]);
    const [loadingSeries, setLoadingSeries] = useState(true);
    const [seriesTab, setSeriesTab] = useState<string>("all");
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        open: false,
        storyId: null,
        title: "",
    });
    const [deleting, setDeleting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [stats, setStats] = useState<Stats>({
        totalStories: 0,
        publishedStories: 0,
        totalViews: 0,
        totalComments: 0,
    });
    const [activeTab, setActiveTab] = useState<string>("all");
    const [loadingStories, setLoadingStories] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    const router = useRouter();
    const supabase = createBrowserClient();

    useEffect(() => {
        async function fetchData() {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                if (!session || !session.user) {
                    router.push("/login");
                    return;
                }
                setUser(session.user);
                try {
                    const { data: profileData, error: profileError } = await supabase
                        .from("profiles")
                        .select("*")
                        .eq("id", session.user.id)
                        .single();
                    if (!profileError) {
                        setProfile(profileData || null);
                    }
                } catch (profileError) {
                    // handle profile error
                }
                try {
                    await fetchUserStories(session.user.id);
                } catch (storiesError) {
                    // handle stories error
                }
                try {
                    await fetchUserSeries(session.user.id);
                } catch (seriesError) {
                    // handle series error
                }
                try {
                    await fetchUserStats(session.user.id);
                } catch (statsError) {
                    // handle stats error
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    async function fetchUserStories(userId: string) {
        setLoadingStories(true);
        const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("author_id", userId)
            .order("created_at", { ascending: false });
        if (!error) setStories(data || []);
        setLoadingStories(false);
    }

    async function fetchUserSeries(userId: string) {
        setLoadingSeries(true);
        const { data, error } = await supabase
            .from("series")
            .select("*")
            .eq("author_id", userId)
            .order("created_at", { ascending: false });
        if (!error) setSeries(data || []);
        setLoadingSeries(false);
    }

    async function fetchUserStats(userId: string) {
        setLoadingStats(true);
        const { data, error } = await supabase.rpc("get_user_stats", { user_id: userId });
        if (!error && data) setStats(data);
        setLoadingStats(false);
    }

    // ... (restante da lógica e renderização, mantendo a estrutura original, mas com tipagem)

    return (
        <div className="dashboard-page max-w-[75rem] mx-auto w-full px-4 md:px-0">
            {/* Renderização dos componentes, tabs, listas, modais, etc. */}
            {/* Exemplo: */}
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            {/* Adapte conforme a lógica e UI do seu dashboard */}
        </div>
    );
}
