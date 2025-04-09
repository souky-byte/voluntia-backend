import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PublicApplicationService } from './public-application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApplicationPublicResponseDto } from './dto/response/application-public-response.dto'; // Import response DTO

@ApiTags('Applications (Public)') // Group in Swagger
@Controller('applications') // Set base route to /applications
export class PublicApplicationController {
  constructor(
    private readonly publicApplicationService: PublicApplicationService,
  ) {}

  /**
   * Endpoint for submitting a new membership application.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED) // Set default response code to 201
  @ApiOperation({ summary: 'Submit a new membership application', description: 'Accepts applicant details and creates a user and application record.' })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application submitted successfully.',
    type: ApplicationPublicResponseDto, // Use specific response DTO
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data (validation failed - see response message for details).',
    // We can create a standard error response DTO later if needed
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email address already exists.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error during application processing.',
  })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' }) // Added Throttler info
  async submitApplication(
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<ApplicationPublicResponseDto> { // Return the specific DTO
    const newApplication = await this.publicApplicationService.createApplication(createApplicationDto);
    // Map the result to the response DTO
    const response: ApplicationPublicResponseDto = {
        id: newApplication.id,
        userId: newApplication.userId,
        desiredMembershipType: newApplication.desiredMembershipType,
        status: newApplication.status,
        createdAt: newApplication.createdAt,
    };
    return response;
  }
}
