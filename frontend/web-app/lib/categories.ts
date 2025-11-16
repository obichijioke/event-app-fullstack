import 'server-only';

import { API_BASE_URL } from './config';
import { EventSummary } from './homepage';

export interface Category {
  id: string;
  slug: string;
  name: string;
  parentId?: string | null;
  children?: Category[];
  _count?: {
    events?: number;
  };
}

export interface CategoryWithEvents extends Category {
  events: EventSummary[];
  subcategories: Category[];
}

/**
 * Fetch all categories from the API
 */
export async function fetchCategories(): Promise<Category[]> {
  try {
    const url = new URL('/api/categories', API_BASE_URL);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Categories API failed with status ${response.status}`);
    }

    const data = (await response.json()) as Category[];
    return data;
  } catch (error) {
    console.error('[categories] Failed to fetch categories', error);
    return [];
  }
}

/**
 * Fetch a single category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const categories = await fetchCategories();
    const category = categories.find((cat) => cat.slug === slug);
    return category || null;
  } catch (error) {
    console.error(`[categories] Failed to fetch category ${slug}`, error);
    return null;
  }
}

/**
 * Build a hierarchical category tree
 */
export function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const roots: Category[] = [];

  // First pass: create map
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree
  categories.forEach((category) => {
    const node = categoryMap.get(category.id);
    if (!node) return;

    if (category.parentId) {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Get top-level categories (no parent)
 */
export function getTopLevelCategories(categories: Category[]): Category[] {
  return categories.filter((cat) => !cat.parentId);
}

/**
 * Get subcategories for a specific category
 */
export function getSubcategories(
  categories: Category[],
  parentId: string,
): Category[] {
  return categories.filter((cat) => cat.parentId === parentId);
}
