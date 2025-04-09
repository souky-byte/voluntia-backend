import {
  Controller,
  Get,
  Param,
  Put,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AdminApplicationService } from './admin-application.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '../auth/enums/role-type.enum';
import { ApplicationQueryDto } from './dto/application-query.dto';
import { ScheduleCallDto } from './dto/schedule-call.dto';
import { DecisionDto } from './dto/decision.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { ApplicationAdminDetailDto } from './dto/response/application-admin-detail.dto';
import { PaginatedApplicationResponseDto } from './dto/response/paginated-application-response.dto';
import { Application } from '../database/entities/application.entity';
import { ApplicationStatus } from '../database/enums/application-status.enum';

// Helper function to map Application entity to DTO
const mapApplicationToAdminDetailDto = (app: Application): ApplicationAdminDetailDto => {
    if (!app.user) {
        // This indicates a data integrity issue if an application exists without a user
        console.error(`Data integrity issue: Application ${app.id} has no associated user.`);
        // Handle this case appropriately, maybe return partial data or throw an error
        // For now, returning null user might break frontend expecting user object.
        // Let's return a minimal user object or adjust the DTO
    }
    return {
        id: app.id,
        desiredMembershipType: app.desiredMembershipType,
        status: app.status,
        motivation: app.motivation,
        additionalData: app.additionalData,
        callScheduledAt: app.callScheduledAt,
        decisionNotes: app.decisionNotes,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        // Ensure user is not null before mapping
        user: app.user ? { id: app.user.id, name: app.user.name, email: app.user.email, phone_number: app.user.phone_number } : {id: -1, name: 'Error: Missing User', email: 'error', phone_number: null }, // Provide a fallback or adjust DTO
        processedByAdmin: app.processedByAdmin ? { id: app.processedByAdmin.id, name: app.processedByAdmin.name } : null,
    };
};

@ApiTags('Applications (Admin)')
@ApiBearerAuth() // All endpoints require JWT
@UseGuards(JwtAuthGuard, RolesGuard) // Apply JWT and Role guards globally to this controller
@Roles(RoleType.ADMIN) // Only Admins can access these endpoints
@Controller('admin/applications') // Set base route
export class AdminApplicationController {
  constructor(private readonly adminApplicationService: AdminApplicationService) {}

  /**
   * Get a paginated list of applications with filtering.
   */
  @Get()
  @ApiOperation({ summary: 'Get paginated list of applications (admin)', description: 'Retrieves applications with filtering and pagination.' })
  @ApiQuery({ name: 'status', required: false, enum: ApplicationStatus, description: 'Filter by application status' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for applicant name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10, maximum: 100 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Paginated list of applications', type: PaginatedApplicationResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error retrieving applications' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  async findAll(@Query() queryDto: ApplicationQueryDto): Promise<PaginatedApplicationResponseDto> {
    const result = await this.adminApplicationService.findAll(queryDto);
    // Map data to DTO
    return {
      ...result,
      data: result.data.map(mapApplicationToAdminDetailDto),
    };
  }

  /**
   * Get details of a specific application.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get application details (admin)', description: 'Retrieves full details for a specific application.' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the application to retrieve', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application details', type: ApplicationAdminDetailDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApplicationAdminDetailDto> {
    const application = await this.adminApplicationService.findOne(id);
    return mapApplicationToAdminDetailDto(application);
  }

  /**
   * Mark an application for a scheduled call.
   */
  @Put(':id/schedule-call')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schedule a call for an application (admin)', description: 'Updates the application status to call_scheduled and sets the date/time.' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the application', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call scheduled successfully', type: ApplicationAdminDetailDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid application state or input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error scheduling call' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  async scheduleCall(
    @Param('id', ParseIntPipe) id: number,
    @Body() scheduleCallDto: ScheduleCallDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApplicationAdminDetailDto> {
    const updatedApplication = await this.adminApplicationService.scheduleCall(id, scheduleCallDto, req.user);
    return mapApplicationToAdminDetailDto(updatedApplication);
  }

  /**
   * Approve an application.
   */
  @Put(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve an application (admin)', description: 'Approves the application, assigns role, sets initial password, and sends welcome email.' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the application', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application approved successfully', type: ApplicationAdminDetailDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid application state' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error approving application (check server logs)' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  async approveApplication(
    @Param('id', ParseIntPipe) id: number,
    @Body() decisionDto: DecisionDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApplicationAdminDetailDto> {
    const updatedApplication = await this.adminApplicationService.approveApplication(id, decisionDto, req.user);
    return mapApplicationToAdminDetailDto(updatedApplication);
  }

  /**
   * Decline an application.
   */
  @Put(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an application (admin)', description: 'Updates the application status to declined.' })
  @ApiParam({ name: 'id', description: 'Numeric ID of the application', type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Application declined successfully', type: ApplicationAdminDetailDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Application not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid application state' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error declining application' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  async declineApplication(
    @Param('id', ParseIntPipe) id: number,
    @Body() decisionDto: DecisionDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApplicationAdminDetailDto> {
    const updatedApplication = await this.adminApplicationService.declineApplication(id, decisionDto, req.user);
    return mapApplicationToAdminDetailDto(updatedApplication);
  }

  /**
   * Smoke test endpoint for admin functionality.
   */
  @Get('/admin/test') // Ensure path doesn't conflict if global prefix isn't used consistently
  @ApiOperation({ summary: 'Smoke test for admin access' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Admin access confirmed.', schema: { example: { message: 'Admin access confirmed!' } } })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.TOO_MANY_REQUESTS, description: 'Too many requests' })
  adminTest(): { message: string } {
    return { message: 'Admin access confirmed!' };
  }
}
