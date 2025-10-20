const Database = require('../models/database');
const User = require('../models/User');
const Company = require('../models/Company');
const TimeOffRequest = require('../models/TimeOffRequest');

async function setupDatabase() {
    console.log('Setting up database with sample data...');
    
    try {
        // Create companies
        const acmeCorp = await Company.create({ name: 'Acme Corporation' });
        const techStartup = await Company.create({ name: 'TechStart Inc.' });
        
        console.log('Created companies:', acmeCorp.name, techStartup.name);
        
        // Create users for Acme Corporation
        const ceo = await User.create({
            email: 'ceo@acme.com',
            password: 'oso123',
            firstName: 'John',
            lastName: 'Smith',
            location: 'New York, NY',
            companyId: acmeCorp.id,
            role: 'ceo',
            salary: 200000,
            ssn: '123-45-6789'
        });
        
        const manager1 = await User.create({
            email: 'manager1@acme.com',
            password: 'oso123',
            firstName: 'Sarah',
            lastName: 'Johnson',
            location: 'San Francisco, CA',
            companyId: acmeCorp.id,
            managerId: ceo.id,
            role: 'manager',
            salary: 150000,
            ssn: '234-56-7890'
        });
        
        const manager2 = await User.create({
            email: 'manager2@acme.com',
            password: 'oso123',
            firstName: 'Mike',
            lastName: 'Wilson',
            location: 'Chicago, IL',
            companyId: acmeCorp.id,
            managerId: ceo.id,
            role: 'manager',
            salary: 140000,
            ssn: '345-67-8901'
        });
        
        const employee1 = await User.create({
            email: 'employee1@acme.com',
            password: 'oso123',
            firstName: 'Alice',
            lastName: 'Brown',
            location: 'San Francisco, CA',
            companyId: acmeCorp.id,
            managerId: manager1.id,
            role: 'employee',
            salary: 80000,
            ssn: '456-78-9012'
        });
        
        const employee2 = await User.create({
            email: 'employee2@acme.com',
            password: 'oso123',
            firstName: 'Bob',
            lastName: 'Davis',
            location: 'San Francisco, CA',
            companyId: acmeCorp.id,
            managerId: manager1.id,
            role: 'employee',
            salary: 75000,
            ssn: '567-89-0123'
        });
        
        const employee3 = await User.create({
            email: 'employee3@acme.com',
            password: 'oso123',
            firstName: 'Carol',
            lastName: 'Miller',
            location: 'Chicago, IL',
            companyId: acmeCorp.id,
            managerId: manager2.id,
            role: 'employee',
            salary: 70000,
            ssn: '678-90-1234'
        });
        
        const employee4 = await User.create({
            email: 'employee4@acme.com',
            password: 'oso123',
            firstName: 'David',
            lastName: 'Garcia',
            location: 'Chicago, IL',
            companyId: acmeCorp.id,
            managerId: manager2.id,
            role: 'employee',
            salary: 72000,
            ssn: '789-01-2345'
        });
        
        console.log('Created users for Acme Corporation');
        
        // Create users for TechStart Inc.
        const techCeo = await User.create({
            email: 'ceo@techstart.com',
            password: 'oso123',
            firstName: 'Emma',
            lastName: 'Taylor',
            location: 'Austin, TX',
            companyId: techStartup.id,
            role: 'ceo',
            salary: 180000,
            ssn: '890-12-3456'
        });
        
        const techManager = await User.create({
            email: 'manager@techstart.com',
            password: 'oso123',
            firstName: 'James',
            lastName: 'Anderson',
            location: 'Austin, TX',
            companyId: techStartup.id,
            managerId: techCeo.id,
            role: 'manager',
            salary: 120000,
            ssn: '901-23-4567'
        });
        
        const techEmployee = await User.create({
            email: 'employee@techstart.com',
            password: 'oso123',
            firstName: 'Lisa',
            lastName: 'Thomas',
            location: 'Austin, TX',
            companyId: techStartup.id,
            managerId: techManager.id,
            role: 'employee',
            salary: 65000,
            ssn: '012-34-5678'
        });
        
        console.log('Created users for TechStart Inc.');
        
        // Create some time-off requests
        const request1 = await TimeOffRequest.create({
            userId: employee1.id,
            startDate: '2024-02-15',
            endDate: '2024-02-16',
            reason: 'Personal appointment'
        });
        
        const request2 = await TimeOffRequest.create({
            userId: employee2.id,
            startDate: '2024-02-20',
            endDate: '2024-02-22',
            reason: 'Vacation'
        });
        
        const request3 = await TimeOffRequest.create({
            userId: employee3.id,
            startDate: '2024-02-25',
            endDate: '2024-02-26',
            reason: 'Sick leave'
        });
        
        const request4 = await TimeOffRequest.create({
            userId: employee4.id,
            startDate: '2024-03-01',
            endDate: '2024-03-05',
            reason: 'Family vacation'
        });
        
        // Approve some requests
        await request1.approve(manager1.id);
        await request2.approve(manager1.id);
        
        console.log('Created time-off requests');
        
        console.log('\n=== Sample Data Setup Complete ===');
        console.log('\nTest Accounts:');
        console.log('Acme Corporation:');
        console.log('  CEO: ceo@acme.com / oso123');
        console.log('  Manager: manager1@acme.com / oso123');
        console.log('  Employee: employee1@acme.com / oso123');
        console.log('\nTechStart Inc.:');
        console.log('  CEO: ceo@techstart.com / oso123');
        console.log('  Manager: manager@techstart.com / oso123');
        console.log('  Employee: employee@techstart.com / oso123');
        console.log('\nManagerial Hierarchy:');
        console.log('CEO -> Manager1 -> Employee1, Employee2');
        console.log('CEO -> Manager2 -> Employee3, Employee4');
        console.log('\nAuthorization Features:');
        console.log('- Managers can view/approve time-off requests from their reports');
        console.log('- Managers can view sensitive information (salary, SSN) of their reports');
        console.log('- All users can view basic profile information of company colleagues');
        
    } catch (error) {
        console.error('Error setting up database:', error);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().then(() => {
        console.log('Setup complete!');
        process.exit(0);
    }).catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = setupDatabase;
