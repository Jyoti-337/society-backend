const { knex, initDB } = require('./database')

async function seed() {
  await initDB()
  console.log('Seeding demo data (no users)...')

  // Clear only non-auth tables
  await knex('members').del()
  await knex('payments').del()
  await knex('complaints').del()
  await knex('visitors').del()
  await knex('notices').del()
  await knex('events').del()
  await knex('finances').del()
  await knex('cctv').del()

  // Demo notices
  await knex('notices').insert([
    { title:'Water Supply Shutdown – 10 May', body:'Water supply will be shut on 10th May from 9AM–1PM for pipeline maintenance.', type:'alert', created_by:'Admin', created_at: new Date().toISOString() },
    { title:'AGM Meeting – 20 May 2025', body:'Annual General Meeting at Clubhouse Hall. All residents requested to attend at 6PM.', type:'meeting', created_by:'Admin', created_at: new Date().toISOString() },
    { title:'Gym Renovation Complete', body:'Society gym is now fully renovated and open for residents.', type:'info', created_by:'Admin', created_at: new Date().toISOString() },
  ])

  // Demo events
  await knex('events').insert([
    { title:'Maintenance Meeting', date:'2025-05-20', time:'6:00 PM', location:'Clubhouse', capacity:50, rsvp:34, category:'meeting', created_at: new Date().toISOString() },
    { title:'Children Day Celebration', date:'2025-05-25', time:'4:00 PM', location:'Garden Area', capacity:100, rsvp:67, category:'festival', created_at: new Date().toISOString() },
    { title:'Yoga Camp', date:'2025-05-18', time:'6:30 AM', location:'Terrace', capacity:30, rsvp:22, category:'wellness', created_at: new Date().toISOString() },
    { title:'Cricket Tournament', date:'2025-06-01', time:'8:00 AM', location:'Ground', capacity:60, rsvp:44, category:'sports', created_at: new Date().toISOString() },
  ])

  // Demo finances
  await knex('finances').insert([
    { type:'expense', category:'Security Salaries', description:'3 guards May month', amount:45000, date:'2025-05-01', approved_by:'Admin', created_at: new Date().toISOString() },
    { type:'expense', category:'Electricity', description:'Common area bill', amount:28000, date:'2025-05-02', approved_by:'Admin', created_at: new Date().toISOString() },
    { type:'expense', category:'Water Bill', description:'Municipal water supply', amount:12000, date:'2025-05-03', approved_by:'Admin', created_at: new Date().toISOString() },
    { type:'income', category:'Maintenance', description:'May collection', amount:186400, date:'2025-05-10', approved_by:'System', created_at: new Date().toISOString() },
  ])

  console.log('✅ Demo data seeded (no users). Register to create accounts.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })