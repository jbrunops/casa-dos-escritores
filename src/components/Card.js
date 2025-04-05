import Link from 'next/link';

export default function Card({ 
  title, 
  author, 
  coverUrl, 
  href, 
  stats = [], 
  badges = [], 
  footerLeft, 
  footerRight 
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden flex flex-col h-full"
    >
      <div className="relative pt-[56.25%] bg-gray-100">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#EEF0FF] text-[#484DB5] text-4xl font-bold">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{title}</h3>
        
        {author && (
          <p className="text-sm text-gray-600 mb-3">
            por <span className="text-[#484DB5]">{author}</span>
          </p>
        )}
        
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {stats.map((stat, index) => (
              <span 
                key={index} 
                className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
              >
                {stat}
              </span>
            ))}
          </div>
        )}
        
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {badges.map((badge, index) => (
              <span 
                key={index} 
                className="inline-block bg-[#EEF0FF] text-[#484DB5] text-xs px-2 py-1 rounded"
              >
                {badge}
              </span>
            ))}
          </div>
        )}
        
        {(footerLeft || footerRight) && (
          <div className="mt-auto pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
            {footerLeft && <span>{footerLeft}</span>}
            {footerRight && (
              <span className={`${
                typeof footerRight === 'object' && footerRight.color 
                  ? footerRight.color 
                  : ''
              }`}>
                {typeof footerRight === 'object' ? footerRight.text : footerRight}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
} 