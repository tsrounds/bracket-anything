import { AutoCompleteCategory } from '@/app/lib/validation/types';

interface CategorySelectorProps {
  onSelect: (category: AutoCompleteCategory) => void;
}

const categories: { id: AutoCompleteCategory; title: string; icon: string; description: string }[] = [
  {
    id: 'sports',
    title: 'Sports',
    icon: '🏀',
    description: 'NFL, NBA, MLB, Soccer, and more',
  },
  {
    id: 'awards',
    title: 'Award Shows',
    icon: '🏆',
    description: 'Oscars, Grammys, Emmys, etc.',
  },
  {
    id: 'tv',
    title: 'TV Shows',
    icon: '📺',
    description: 'Reality TV, competitions, finales',
  },
];

export default function CategorySelector({ onSelect }: CategorySelectorProps) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Select the category that best matches your quiz:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-center group"
          >
            <span className="text-2xl mb-2">{cat.icon}</span>
            <span className="font-medium text-gray-900 group-hover:text-indigo-700">
              {cat.title}
            </span>
            <span className="text-xs text-gray-500 mt-1">{cat.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
