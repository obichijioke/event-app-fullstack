import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CityService } from './city.service';
import { SearchCitiesDto } from './dto/search-cities.dto';
import { CityResponseDto, CityListResponseDto } from './dto/city-response.dto';

@ApiTags('Cities')
@Controller('cities')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get()
  @ApiOperation({
    summary: 'Search cities',
    description: 'Search for cities by name, with optional filters',
  })
  @ApiOkResponse({ type: CityListResponseDto })
  async searchCities(@Query() dto: SearchCitiesDto) {
    const cities = await this.cityService.searchCities(dto);
    return { data: cities };
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular cities',
    description: 'Get a list of major/popular cities, optionally filtered by country',
  })
  @ApiOkResponse({ type: CityListResponseDto })
  async getPopularCities(
    @Query('country') country?: string,
    @Query('limit') limit?: number,
  ) {
    const cities = await this.cityService.getPopularCities(country, limit);
    return { data: cities };
  }

  @Get('countries')
  @ApiOperation({
    summary: 'Get list of countries',
    description: 'Get a list of countries that have cities in the database',
  })
  async getCountries() {
    const countries = await this.cityService.getCountries();
    return { data: countries };
  }

  @Get('country/:countryCode')
  @ApiOperation({
    summary: 'Get cities by country',
    description: 'Get all cities in a specific country',
  })
  @ApiOkResponse({ type: CityListResponseDto })
  async getCitiesByCountry(
    @Param('countryCode') countryCode: string,
    @Query('limit') limit?: number,
  ) {
    const cities = await this.cityService.getCitiesByCountry(countryCode, limit);
    return { data: cities };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get city by ID',
    description: 'Get detailed information about a specific city',
  })
  @ApiOkResponse({ type: CityResponseDto })
  @ApiNotFoundResponse({ description: 'City not found' })
  async getCityById(@Param('id') id: string) {
    const city = await this.cityService.getCityById(id);
    if (!city) {
      throw new NotFoundException('City not found');
    }
    return city;
  }
}
