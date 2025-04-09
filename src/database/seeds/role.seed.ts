import dataSource from '../../data-source';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { RoleType } from '../../auth/enums/role-type.enum';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

interface RoleSeed {
  name: string;
  slug: RoleType;
  description?: string;
}

const rolesToSeed: RoleSeed[] = [
  {
    name: 'Admin',
    slug: RoleType.ADMIN,
    description: 'System administrator with full access',
  },
  {
    name: 'Community Member',
    slug: RoleType.COMMUNITY,
    description: 'Basic community member',
  },
  {
    name: 'Registered Supporter',
    slug: RoleType.SUPPORTER,
    description: 'Verified supporter of the party',
  },
  {
    name: 'Party Member',
    slug: RoleType.MEMBER,
    description: 'Full member of the political party',
  },
];

export const ADMIN_EMAIL = 'admin@voluntia.app';
export const ADMIN_PASSWORD = 'ChangeMe123!';

export async function seedDatabase(dataSourceInstance?: DataSource): Promise<void> {
  const dataSourceToUse = dataSourceInstance || dataSource;
  const isExternalDS = !!dataSourceInstance;

  console.log('Connecting to database for seeding...');
  if (!isExternalDS) {
      await dataSourceToUse.initialize();
  }
  console.log('Database connected. Seeding roles and admin user...');

  const roleRepository = dataSourceToUse.getRepository(Role);
  const userRepository = dataSourceToUse.getRepository(User);

  const seededRoles: { [key in RoleType]?: Role } = {};
  for (const roleData of rolesToSeed) {
    let role = await roleRepository.findOneBy({ slug: roleData.slug });
    if (!role) {
      role = roleRepository.create(roleData);
      await roleRepository.save(role);
      console.log(`Seeding: Created role: ${roleData.name}`);
    } else {
      // console.log(`Seeding: Role already exists: ${roleData.name}`);
    }
    seededRoles[roleData.slug] = role;
  }
  // console.log('Seeding: Role seeding finished.');

  let adminUser = await userRepository.findOne({ where: { email: ADMIN_EMAIL }, relations: ['roles'] });

  if (!adminUser) {
    const adminRole = seededRoles[RoleType.ADMIN];
    if (!adminRole) {
        throw new Error('Admin role was not seeded correctly!');
    }
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    adminUser = userRepository.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      email_verified_at: new Date(),
      roles: [adminRole],
    });
    await userRepository.save(adminUser);
    console.log(`Seeding: Created admin user: ${ADMIN_EMAIL}`);
  } else {
    // console.log(`Seeding: Admin user already exists: ${ADMIN_EMAIL}`);
    const adminRole = seededRoles[RoleType.ADMIN];
    if (adminRole && !adminUser.roles.some(r => r.slug === RoleType.ADMIN)) {
        adminUser.roles.push(adminRole);
        await userRepository.save(adminUser);
        console.log(`Seeding: Assigned admin role to existing user: ${ADMIN_EMAIL}`);
    }
  }
  // console.log('Seeding: Admin user seeding finished.');

  console.log('Seeding finished.');
  if (!isExternalDS) {
      await dataSourceToUse.destroy();
      console.log('Database connection closed by seeder.');
  }
} 