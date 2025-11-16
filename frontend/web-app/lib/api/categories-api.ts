import { ApiClient } from './client';

export interface Category {
  id: string;
  slug: string;
  name: string;
}

class CategoriesApiClient extends ApiClient {
  async getCategories(): Promise<Category[]> {
    return this.get('/categories');
  }
}

export const categoriesApi = new CategoriesApiClient();
