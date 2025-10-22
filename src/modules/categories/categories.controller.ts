
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Public()
    @Get()
    @ApiOperation({ summary: 'Get all quiz categories' })
    @ApiResponse({ status: 200, description: 'Returns all available categories' })
    getAllCategories() {
        return this.categoriesService.getAllCategories();
    }

    @Public()
    @Get(':id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiResponse({ status: 200, description: 'Returns category details' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    getCategoryById(@Param('id') id: string) {
        return this.categoriesService.getCategoryById(id);
    }
}