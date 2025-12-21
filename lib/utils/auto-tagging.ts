/**
 * Auto-tagging system - Analyzes conversation content and assigns tags
 */

export interface Tag {
  id: string;
  label: string;
  color: string;
  category: 'support' | 'product' | 'priority' | 'sentiment';
}

// Keyword mappings for auto-tagging
const TAG_KEYWORDS = {
  // Support-related
  bug: {
    keywords: ['bug', 'broken', 'error', 'crash', 'not working', 'issue', 'problem', 'glitch', 'malfunction'],
    tag: { id: 'bug', label: 'Bug', color: 'bg-red-100 text-red-700 border-red-200', category: 'support' as const }
  },
  feature_request: {
    keywords: ['feature', 'suggestion', 'could you add', 'would be nice', 'enhancement', 'improvement', 'wish'],
    tag: { id: 'feature_request', label: 'Feature Request', color: 'bg-purple-100 text-purple-700 border-purple-200', category: 'support' as const }
  },
  billing: {
    keywords: ['refund', 'payment', 'charge', 'billing', 'invoice', 'price', 'cost', 'subscription', 'cancel'],
    tag: { id: 'billing', label: 'Billing', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', category: 'support' as const }
  },
  shipping: {
    keywords: ['shipping', 'delivery', 'tracking', 'shipment', 'package', 'arrived', 'transit', 'delayed'],
    tag: { id: 'shipping', label: 'Shipping', color: 'bg-blue-100 text-blue-700 border-blue-200', category: 'support' as const }
  },
  return: {
    keywords: ['return', 'exchange', 'send back', 'wrong item', 'damaged', 'defective'],
    tag: { id: 'return', label: 'Return/Exchange', color: 'bg-orange-100 text-orange-700 border-orange-200', category: 'support' as const }
  },

  // Product-related
  sizing: {
    keywords: ['size', 'fit', 'dimension', 'measurement', 'too big', 'too small', 'length', 'width'],
    tag: { id: 'sizing', label: 'Sizing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', category: 'product' as const }
  },
  quality: {
    keywords: ['quality', 'material', 'fabric', 'construction', 'durability', 'wear'],
    tag: { id: 'quality', label: 'Quality', color: 'bg-teal-100 text-teal-700 border-teal-200', category: 'product' as const }
  },
  availability: {
    keywords: ['stock', 'available', 'out of stock', 'restock', 'back order', 'in stock', 'sold out'],
    tag: { id: 'availability', label: 'Stock/Availability', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', category: 'product' as const }
  },

  // Priority
  urgent: {
    keywords: ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'important', 'help!', 'please help'],
    tag: { id: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-300', category: 'priority' as const }
  },

  // Sentiment
  complaint: {
    keywords: ['disappointed', 'frustrated', 'angry', 'terrible', 'worst', 'awful', 'horrible', 'upset'],
    tag: { id: 'complaint', label: 'Complaint', color: 'bg-rose-100 text-rose-700 border-rose-200', category: 'sentiment' as const }
  },
  praise: {
    keywords: ['thank you', 'thanks', 'love', 'amazing', 'excellent', 'perfect', 'great', 'awesome', 'fantastic'],
    tag: { id: 'praise', label: 'Positive', color: 'bg-green-100 text-green-700 border-green-200', category: 'sentiment' as const }
  },
  question: {
    keywords: ['how', 'what', 'when', 'where', 'why', 'which', 'can i', 'could you', 'is it', 'do you', '?'],
    tag: { id: 'question', label: 'Question', color: 'bg-gray-100 text-gray-700 border-gray-200', category: 'sentiment' as const }
  },
};

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Analyze conversation messages and return detected tags
 */
export function detectTags(messages: Array<{ content: string; sender_type: string }>): Tag[] {
  const detectedTags = new Set<string>();
  const allText = messages
    .filter(m => m.sender_type === 'customer') // Only analyze customer messages
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Check each tag's keywords
  Object.entries(TAG_KEYWORDS).forEach(([tagId, { keywords, tag }]) => {
    const hasKeyword = keywords.some(keyword => {
      // Special handling for single-character special regex chars like '?'
      if (keyword === '?') {
        return allText.includes('?');
      }

      // Escape special regex characters and use word boundaries for more accurate matching
      const escapedKeyword = escapeRegex(keyword.toLowerCase());
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      return regex.test(allText);
    });

    if (hasKeyword) {
      detectedTags.add(tagId);
    }
  });

  // Convert tag IDs to tag objects
  return Array.from(detectedTags).map(tagId => {
    const entry = Object.entries(TAG_KEYWORDS).find(([id]) => id === tagId);
    return entry ? entry[1].tag : null;
  }).filter((tag): tag is Tag => tag !== null);
}

/**
 * Get tag by ID
 */
export function getTagById(tagId: string): Tag | null {
  const entry = Object.entries(TAG_KEYWORDS).find(([id]) => id === tagId);
  return entry ? entry[1].tag : null;
}

/**
 * Get all available tags
 */
export function getAllTags(): Tag[] {
  return Object.values(TAG_KEYWORDS).map(({ tag }) => tag);
}
