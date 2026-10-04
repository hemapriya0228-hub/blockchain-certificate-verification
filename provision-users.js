import { connectToDatabase } from './db.js';
import bcrypt from 'bcryptjs';

async function provisionNewAccounts() {
  console.log('--- CHAINCERT USER PROVISIONING START ---');
  const { db, mode } = await connectToDatabase();
  console.log(`Database connected in mode: ${mode}`);

  const usersCol = db.collection('users');
  
  // 1. Inspect & Count existing users BEFORE
  const initialUsers = await usersCol.find({}).toArray();
  console.log(`Existing users count BEFORE provisioning: ${initialUsers.length}`);
  const existingEmails = new Set(initialUsers.map(u => u.email.toLowerCase()));

  // 2. Define the 13 required accounts
  const newAccountsToCreate = [
    // 10 Students
    { email: 'student01@chaincert.test', full_name: 'Student 01', role: 'student' },
    { email: 'student02@chaincert.test', full_name: 'Student 02', role: 'student' },
    { email: 'student03@chaincert.test', full_name: 'Student 03', role: 'student' },
    { email: 'student04@chaincert.test', full_name: 'Student 04', role: 'student' },
    { email: 'student05@chaincert.test', full_name: 'Student 05', role: 'student' },
    { email: 'student06@chaincert.test', full_name: 'Student 06', role: 'student' },
    { email: 'student07@chaincert.test', full_name: 'Student 07', role: 'student' },
    { email: 'student08@chaincert.test', full_name: 'Student 08', role: 'student' },
    { email: 'student09@chaincert.test', full_name: 'Student 09', role: 'student' },
    { email: 'student10@chaincert.test', full_name: 'Student 10', role: 'student' },
    
    // 2 Teachers
    { email: 'teacher01@chaincert.test', full_name: 'Professor Alpha', role: 'teacher' },
    { email: 'teacher02@chaincert.test', full_name: 'Professor Beta', role: 'teacher' },
    
    // 1 Admin
    { email: 'admin01@chaincert.test', full_name: 'Executive Admin', role: 'admin' },
  ];

  const defaultSecureHash = await bcrypt.hash('Password123!', 10);
  let addedCount = 0;

  for (const account of newAccountsToCreate) {
    if (existingEmails.has(account.email.toLowerCase())) {
      console.log(`[SKIPPED] Account ${account.email} already exists.`);
      continue;
    }

    const newUserDoc = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: account.email,
      full_name: account.full_name,
      role: account.role,
      status: 'approved',
      password: defaultSecureHash,
      created_at: new Date().toISOString(),
    };

    await usersCol.insertOne(newUserDoc);
    console.log(`[ADDED] ${account.role.toUpperCase()}: ${account.email}`);
    addedCount++;
  }

  // 3. Inspect & Count existing users AFTER
  const finalUsers = await usersCol.find({}).toArray();
  console.log(`\nExisting users count AFTER provisioning: ${finalUsers.length}`);
  console.log(`Total new accounts successfully added: ${addedCount}`);
  console.log('--- CHAINCERT USER PROVISIONING COMPLETE ---');

  process.exit(0);
}

provisionNewAccounts().catch(err => {
  console.error('Provisioning failed:', err);
  process.exit(1);
});
