require('dotenv').config();
console.log("Database Password from Env:", process.env.DB_PASSWORD);
const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if users already exist
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = result.rows[0].count;

    if (userCount > 0) {
      console.log('✅ Users already exist in database. Skipping user seeding.');
      return;
    }

    // Create users with hashed passwords
    const users = [
      { email: 'admin@test.com', password: 'admin123', name: 'Admin User', role: 'admin' },
      { email: 'user@test.com', password: 'user123', name: 'Regular User', role: 'user' },
      { email: 'supplier@test.com', password: 'supplier123', name: 'Supplier User', role: 'supplier' }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [user.email, hashedPassword, user.name, user.role]
      );
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📝 Default Login Credentials:');
    console.log('   Admin: admin@test.com / admin123');
    console.log('   User: user@test.com / user123');
    console.log('   Supplier: supplier@test.com / supplier123\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
}

// Run seeding
seedDatabase().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
