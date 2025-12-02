/**
 * Format category with proper capitalization
 */
export function formatCategory(category: string): string {
  if (!category) return '';
  
  const categoryMap: { [key: string]: string } = {
    'groceries': 'Groceries',
    'dining': 'Dining',
    'coffee': 'Coffee',
    'gas': 'Gas & Fuel',
    'transportation': 'Transportation',
    'shopping': 'Shopping',
    'pharmacy': 'Pharmacy',
    'healthcare': 'Healthcare',
    'entertainment': 'Entertainment',
    'utilities': 'Utilities',
    'travel': 'Travel',
    'home': 'Home & Garden',
    'other': 'Other'
  };
  
  return categoryMap[category.toLowerCase()] || capitalizeText(category);
}

/**
 * Capitalize text properly (converts snake_case to Title Case)
 */
export function capitalizeText(text: string): string {
  if (!text) return text;
  return text
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
