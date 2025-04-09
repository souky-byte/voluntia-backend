import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { HttpExceptionFilter } from '../src/core/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { ApplicationStatus } from '../src/database/enums/application-status.enum';
import { seedDatabase } from '../src/database/seeds/role.seed'; // Import seed function
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../src/database/seeds/role.seed'; // Import admin credentials
import { APP_GUARD } from '@nestjs/core'; // Import APP_GUARD
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'; // Import ThrottlerGuard and ThrottlerModule

describe('E2E Tests for Voluntia API', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let apiPrefix: string;
  let httpServer: any; // Store httpServer for requests

  // Run once before all tests
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
       imports: [
           AppModule,
           ThrottlerModule.forRoot([
                 {
                     ttl: 1000,
                     limit: 10000,
                 },
             ]),
         ],
     })
     .compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes and filters
    const configService = app.get(ConfigService);
    apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
    app.setGlobalPrefix(apiPrefix);
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    httpServer = app.getHttpServer();
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  // Clean and seed database before EACH test
  beforeEach(async () => {
    console.log('------ Test Start: Cleaning and Seeding DB ------');
    try {
        // Use delete (or clear if it worked reliably)
        await dataSource.getRepository('role_user').delete({});
        await dataSource.getRepository('applications').delete({});
        await dataSource.getRepository('users').delete({});
        await dataSource.getRepository('roles').delete({});
        // Seed roles and admin user
        await seedDatabase(dataSource);
    } catch (error) {
        console.error('DB Cleanup/Seed Error in beforeEach:', error);
        throw error; // Fail test if setup fails
    }
    console.log('------ Test Setup Complete ------');
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) { // Use isInitialized check
        try {
            await dataSource.destroy();
            console.log('DataSource destroyed in afterAll.');
        } catch (error) {
            console.error('Error destroying dataSource in afterAll:', error);
        }
    }
    if (app) {
        await app.close();
        console.log('Nest application closed in afterAll.');
    }
  });

  // Helper function for admin login
  const loginAdmin = async (): Promise<string> => {
      const response = await request(httpServer)
          .post(`${apiPrefix}/auth/login`)
          .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
          .expect(HttpStatus.OK);
      expect(response.body.access_token).toBeDefined();
      return response.body.access_token;
  };

  // Remove the default test or keep if desired
  // it('/ (GET) should return Hello World', ...);

  // --- Public Applications API Tests ---
  describe('Public Applications API (/applications)', () => {
    it('should successfully create a community member application', async () => {
      const dto = {
        name: 'E2E Community User',
        email: 'e2e.community@example.com',
        desiredMembershipType: 'community',
        motivation: 'E2E Test motivation',
        gdprConsent: true,
      };

      // Send POST request
      const response = await request(httpServer)
        .post(`${apiPrefix}/applications`)
        .send(dto)
        .expect(HttpStatus.CREATED); // Check for 201 status

      // Check response body structure and values
      expect(response.body).toBeDefined();
      expect(response.body.id).toEqual(expect.any(Number));
      expect(response.body.userId).toEqual(expect.any(Number));
      expect(response.body.desiredMembershipType).toBe(dto.desiredMembershipType);
      expect(response.body.status).toBe(ApplicationStatus.PENDING);
      expect(response.body.createdAt).toBeDefined();

      // Verify data in the database
      const applicationInDb = await dataSource.getRepository('applications').findOne({ where: { id: response.body.id }, relations: ['user'] });
      expect(applicationInDb).not.toBeNull();

      if (applicationInDb) { // Type guard
        expect(applicationInDb.status).toBe(ApplicationStatus.PENDING);
        expect(applicationInDb.motivation).toBe(dto.motivation);
        expect(applicationInDb.user).toBeDefined();
        expect(applicationInDb.user).not.toBeNull();
        if (applicationInDb.user) { // Type guard for user
          expect(applicationInDb.user.email).toBe(dto.email);
          expect(applicationInDb.user.name).toBe(dto.name);
        }
      }
    });

    it('should successfully create a supporter application', async () => {
        const dto = {
          name: 'E2E Supporter User',
          email: 'e2e.supporter@example.com',
          desiredMembershipType: 'supporter',
          phone_number: '+420777111222', // Assuming validation is fixed/adjusted
          additionalDataSupporter: { city: 'Test City' },
          motivation: 'Supporter E2E motivation',
          gdprConsent: true,
          supporterStatutesConsent: true,
        };
        await request(httpServer)
          .post(`${apiPrefix}/applications`)
          .send(dto)
          .expect(HttpStatus.CREATED)
          .then(response => {
              expect(response.body.id).toEqual(expect.any(Number));
              expect(response.body.desiredMembershipType).toBe(dto.desiredMembershipType);
              // Add DB check if needed
          });
    });

    it('should successfully create a member application', async () => {
        const dto = {
          name: 'E2E Member User',
          email: 'e2e.member@example.com',
          desiredMembershipType: 'member',
          phone_number: '+420777333444',
          additionalDataMember: { full_address: 'Test Address 1', date_of_birth: '1999-01-01' },
          motivation: 'Member E2E motivation',
          gdprConsent: true,
          partyStatutesConsent: true,
          noOtherPartyMembership: true,
        };
        await request(httpServer)
          .post(`${apiPrefix}/applications`)
          .send(dto)
          .expect(HttpStatus.CREATED)
          .then(response => {
              expect(response.body.id).toEqual(expect.any(Number));
              expect(response.body.desiredMembershipType).toBe(dto.desiredMembershipType);
              // Add DB check if needed
          });
    });

    it('should return 409 conflict for existing email', async () => {
       // First create a user
       const dto1 = { name: 'Conflict User', email: 'conflict@example.com', desiredMembershipType: 'community', gdprConsent: true };
       await request(httpServer).post(`${apiPrefix}/applications`).send(dto1).expect(HttpStatus.CREATED);

       // Attempt to create another with the same email
       const dto2 = { name: 'Another User', email: 'conflict@example.com', desiredMembershipType: 'supporter', phone_number: '+420111222333', additionalDataSupporter: { city: 'Conflict City' }, motivation: 'Conflict', gdprConsent: true, supporterStatutesConsent: true };
       await request(httpServer)
          .post(`${apiPrefix}/applications`)
          .send(dto2)
          .expect(HttpStatus.CONFLICT)
          .then(response => {
              expect(response.body.message).toContain('already exists');
          });
    });

    it('should return 400 bad request for missing required fields (supporter)', async () => {
        const dto = {
          name: 'Incomplete Supporter',
          email: 'incomplete.supporter@example.com',
          desiredMembershipType: 'supporter',
          // Missing phone_number, additionalDataSupporter.city, supporterStatutesConsent
          motivation: 'Incomplete',
          gdprConsent: true,
        };
        await request(httpServer)
          .post(`${apiPrefix}/applications`)
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST)
          .then(response => {
              // Update expected messages - check for key parts
              expect(response.body.message).toEqual(expect.arrayContaining([
                  expect.stringContaining('Phone number is required'), // More general check
                  expect.stringContaining('Additional data is required for Supporters'),
                  expect.stringContaining('Agreement with supporter statutes must be true'),
              ]));
              // Optionally, check the length if it should be exactly 3 main errors
              // expect(response.body.message.length).toBeGreaterThanOrEqual(3);
          });
    });

     it('should return 400 bad request for invalid email format', async () => {
        const dto = { name: 'Bad Email', email: 'bad-email-format', desiredMembershipType: 'community', gdprConsent: true };
        await request(httpServer)
          .post(`${apiPrefix}/applications`)
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST)
          .then(response => {
              expect(response.body.message).toEqual(expect.arrayContaining([expect.stringContaining('email must be an email')]));
          });
    });
  });

  // --- Auth API Tests ---
  describe('Auth API (/auth)', () => {
    // beforeEach seeding handles admin user creation

    it('should login admin user successfully and return JWT', async () => {
      await loginAdmin(); // Uses helper, checks status and token presence internally
    });

    it('should fail login with incorrect password', async () => {
      await request(httpServer)
        .post(`${apiPrefix}/auth/login`)
        .send({ email: ADMIN_EMAIL, password: 'WrongPassword!' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should get user profile with valid JWT', async () => {
      const token = await loginAdmin();
      await request(httpServer)
        .get(`${apiPrefix}/auth/profile`)
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK)
        .then(response => {
          expect(response.body.email).toBe(ADMIN_EMAIL);
          expect(response.body.sub).toEqual(expect.any(Number));
          expect(response.body.roles).toContain('admin');
        });
    });

    it('should fail to get profile with invalid/missing JWT', async () => {
      await request(httpServer)
        .get(`${apiPrefix}/auth/profile`)
        // No token sent
        .expect(HttpStatus.UNAUTHORIZED);

      await request(httpServer)
        .get(`${apiPrefix}/auth/profile`)
        .set('Authorization', `Bearer invalidtoken`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- Admin Applications API Tests ---
  describe('Admin Applications API (/admin/applications)', () => {
    let adminToken: string;

    // Login admin before each admin test to get fresh token with correct ID
    beforeEach(async () => {
        adminToken = await loginAdmin();
    });

    it('should get list of applications', async () => {
        // Arrange: Create some applications first for this specific test
        const dto1 = { name: 'List Test 1', email: 'list1@example.com', desiredMembershipType: 'community', gdprConsent: true };
        await request(httpServer).post(`${apiPrefix}/applications`).send(dto1).expect(HttpStatus.CREATED);
        const dto2 = { name: 'List Test 2', email: 'list2@example.com', desiredMembershipType: 'member', phone_number:'+123', additionalDataMember:{full_address:'a', date_of_birth:'2000-01-01'}, motivation:'m', gdprConsent:true, partyStatutesConsent:true, noOtherPartyMembership:true };
        await request(httpServer).post(`${apiPrefix}/applications`).send(dto2).expect(HttpStatus.CREATED);

        // Act & Assert
        await request(httpServer)
            .get(`${apiPrefix}/admin/applications`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.data).toBeInstanceOf(Array);
                // Now we expect exactly 2 from this test setup
                expect(response.body.data.length).toBe(2);
                expect(response.body.total).toBe(2);
                expect(response.body.data[0].user).toBeDefined();
            });
    });

    it('should filter applications by status', async () => {
        // Arrange: Create applications with different statuses needed for filtering
        const dtoPending = { name: 'Filter Pending', email: 'filter.pending@example.com', desiredMembershipType: 'community', gdprConsent: true };
        const resPending = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoPending).expect(HttpStatus.CREATED);
        const pendingAppId = resPending.body.id;

        const dtoApprovable = { name: 'Filter Approvable', email: 'filter.approvable@example.com', desiredMembershipType: 'member', phone_number:'+123', additionalDataMember:{full_address:'a', date_of_birth:'2000-01-01'}, motivation:'m', gdprConsent:true, partyStatutesConsent:true, noOtherPartyMembership:true };
        const resApprovable = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoApprovable).expect(HttpStatus.CREATED);
        const approvableAppId = resApprovable.body.id;

        // Approve one
        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${approvableAppId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ decisionNotes: 'Filter test approve' })
            .expect(HttpStatus.OK);

        // Act & Assert: Get only pending
        await request(httpServer)
            .get(`${apiPrefix}/admin/applications?status=${ApplicationStatus.PENDING}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.data.length).toBe(1);
                expect(response.body.data[0].id).toBe(pendingAppId);
                expect(response.body.data[0].status).toBe(ApplicationStatus.PENDING);
                expect(response.body.total).toBe(1);
            });
    });

    it('should get application details', async () => {
        // Arrange: Create application for this test
        const dtoMember = { name: 'Detail Test Member', email: 'detail.member@example.com', desiredMembershipType: 'member', phone_number: '+420777555666', additionalDataMember: { full_address: 'Detail Test Addr 1', date_of_birth: '2000-02-02' }, motivation: 'Detail Member', gdprConsent: true, partyStatutesConsent: true, noOtherPartyMembership: true };
        const resMember = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoMember).expect(HttpStatus.CREATED);
        const appToGetId = resMember.body.id;

        // Act & Assert
        await request(httpServer)
            .get(`${apiPrefix}/admin/applications/${appToGetId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.id).toBe(appToGetId);
                expect(response.body.user.email).toBe('detail.member@example.com');
                expect(response.body.additionalData.full_address).toBeDefined();
            });
    });

    it('should return 404 for non-existent application detail', async () => {
        // No Arrange needed
        // Act & Assert
        await request(httpServer)
            .get(`${apiPrefix}/admin/applications/99999`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(HttpStatus.NOT_FOUND);
    });

    it('should schedule a call for a pending application', async () => {
        // Arrange: Create application for this test
        const dtoCommunity = { name: 'Schedule Test Community', email: 'schedule.community@example.com', desiredMembershipType: 'community', gdprConsent: true };
        const resCommunity = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoCommunity).expect(HttpStatus.CREATED);
        const appToScheduleId = resCommunity.body.id;

        // Act & Assert
        const scheduleTime = new Date();
        scheduleTime.setDate(scheduleTime.getDate() + 1); // Tomorrow
        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${appToScheduleId}/schedule-call`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ callScheduledAt: scheduleTime.toISOString() })
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.status).toBe(ApplicationStatus.CALL_SCHEDULED);
                expect(response.body.callScheduledAt).toBe(scheduleTime.toISOString());
            });
    });

    it('should approve a pending application', async () => {
        // Arrange: Create application for this test
        const dtoApprove = { name: 'Approve Test Community', email: 'approve.community@example.com', desiredMembershipType: 'community', gdprConsent: true };
        const resApprove = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoApprove).expect(HttpStatus.CREATED);
        const appToApproveId = resApprove.body.id;

        // Act & Assert
        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${appToApproveId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ decisionNotes: 'Looks good!' })
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.status).toBe(ApplicationStatus.APPROVED);
                expect(response.body.decisionNotes).toBe('Looks good!');
            });
        // Add DB checks for user role and password (if uncommented)
    });

    it('should decline a pending application', async () => {
        // Arrange: Create a specific application for this test
        const dtoDecline = { name: 'Decline Test', email: 'decline@example.com', desiredMembershipType: 'community', gdprConsent: true };
        const resDecline = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoDecline).expect(HttpStatus.CREATED);
        const declineAppId = resDecline.body.id;

        // Act & Assert
        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${declineAppId}/decline`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ decisionNotes: 'Not suitable.' })
            .expect(HttpStatus.OK)
            .then(response => {
                expect(response.body.status).toBe(ApplicationStatus.DECLINED);
                expect(response.body.decisionNotes).toBe('Not suitable.');
            });
    });

    it('should fail to approve an already declined application', async () => {
        // Arrange: Create and decline an application
        const dtoFailApprove = { name: 'Fail Approve Test', email: 'failapprove@example.com', desiredMembershipType: 'community', gdprConsent: true };
        const resFailApprove = await request(httpServer).post(`${apiPrefix}/applications`).send(dtoFailApprove).expect(HttpStatus.CREATED);
        const failApproveId = resFailApprove.body.id;

        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${failApproveId}/decline`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({})
            .expect(HttpStatus.OK);

        // Act & Assert: Attempt approve
        await request(httpServer)
            .put(`${apiPrefix}/admin/applications/${failApproveId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({})
            .expect(HttpStatus.BAD_REQUEST)
            .then(response => {
                expect(response.body.message).toContain('already been processed');
            });
    });

    it('should fail access without JWT', async () => {
        await request(httpServer)
            .get(`${apiPrefix}/admin/applications`)
            .expect(HttpStatus.UNAUTHORIZED);
    });

  });
});
