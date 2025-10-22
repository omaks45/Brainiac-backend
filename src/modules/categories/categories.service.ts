
import { Injectable } from '@nestjs/common';
import { QUIZ_CATEGORIES } from './categories.constants';

@Injectable()
export class CategoriesService {
    getAllCategories() {
        return QUIZ_CATEGORIES;
    }

    getCategoryById(id: string) {
        return QUIZ_CATEGORIES.find(cat => cat.id === id);
    }
}