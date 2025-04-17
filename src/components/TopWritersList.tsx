import Link from 'next/link';
import { BookText, MessageSquare } from 'lucide-react';

interface Writer {
  author_id: string;
  id: string;
  username: string;
  avatar_url?: string;
  content_count: number;
}

interface TopWritersListProps {
  writers: Writer[];
}

function WriterRankItem({ writer, rank }: { writer: Writer; rank: number }) {
  return (
    <div
      key={writer.author_id}
      className="flex items-center p-4 md:py-3 md:px-3 rounded-lg border border-[#E5E7EB] hover:shadow-sm transition-shadow"
    >
      <span className="font-bold text-xl w-8 text-center mr-3 text-[#484DB5] shrink-0">{rank}</span>
      {writer.avatar_url ? (
        <img
          src={writer.avatar_url}
          alt={writer.username}
          className="w-10 h-10 rounded-full mr-3 object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#484DB5] text-white flex items-center justify-center mr-3 shrink-0">
          {writer.username?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${writer.username}`} className="font-semibold text-base hover:text-[#484DB5] transition-colors block truncate">
          {writer.username}
        </Link>
        <div className="flex flex-wrap items-center space-x-3 text-sm text-gray-600 mt-1">
          <span className="inline-flex items-center">
            <BookText size={14} className="mr-1 text-gray-500 shrink-0" />
            {writer.content_count} {writer.content_count === 1 ? 'publicação' : 'publicações'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TopWritersList({ writers }: TopWritersListProps) {
  if (!writers || writers.length === 0) {
    return <p>Nenhum escritor ativo ainda.</p>;
  }
  return (
    <div className="space-y-3">
      {writers.map((writer, index) => (
        <WriterRankItem writer={writer} rank={index + 1} key={writer.id} />
      ))}
    </div>
  );
}
