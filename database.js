const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: './society.db' },
  useNullAsDefault: true
});

async function initDB() {
  // USERS
  const hasUsers = await knex.schema.hasTable('users')
  if (!hasUsers) {
    await knex.schema.createTable('users', t => {
      t.increments('id')
      t.string('name').notNullable()
      t.string('email').unique().notNullable()
      t.string('password').notNullable()
      t.string('role').defaultTo('resident')
      t.string('flat')
      t.string('phone')
      t.string('status').defaultTo('owner')
      t.string('created_at')
      t.string('updated_at')
    })
  } else {
    // Add missing columns if they don't exist (migration)
    const hasStatus = await knex.schema.hasColumn('users', 'status')
    if (!hasStatus) await knex.schema.table('users', t => t.string('status').defaultTo('owner'))
    const hasCreatedAt = await knex.schema.hasColumn('users', 'created_at')
    if (!hasCreatedAt) await knex.schema.table('users', t => t.string('created_at'))
    const hasUpdatedAt = await knex.schema.hasColumn('users', 'updated_at')
    if (!hasUpdatedAt) await knex.schema.table('users', t => t.string('updated_at'))
    const hasPhone = await knex.schema.hasColumn('users', 'phone')
    if (!hasPhone) await knex.schema.table('users', t => t.string('phone'))
    const hasFlat = await knex.schema.hasColumn('users', 'flat')
    if (!hasFlat) await knex.schema.table('users', t => t.string('flat'))
  }

  // MEMBERS
  const hasMembers = await knex.schema.hasTable('members')
  if (!hasMembers) {
    await knex.schema.createTable('members', t => {
      t.increments('id')
      t.string('name').notNullable()
      t.string('flat').notNullable()
      t.string('role').defaultTo('Resident')
      t.string('phone')
      t.string('email')
      t.string('status').defaultTo('owner')
      t.string('since')
    })
  }

  // PAYMENTS
  const hasPayments = await knex.schema.hasTable('payments')
  if (!hasPayments) {
    await knex.schema.createTable('payments', t => {
      t.increments('id')
      t.string('flat').notNullable()
      t.string('name').notNullable()
      t.float('amount').notNullable()
      t.string('month')
      t.integer('year')
      t.string('status').defaultTo('pending')
      t.string('method')
      t.string('txn_id')
      t.string('paid_at')
      t.string('created_at')
    })
  }

  // COMPLAINTS
  const hasComplaints = await knex.schema.hasTable('complaints')
  if (!hasComplaints) {
    await knex.schema.createTable('complaints', t => {
      t.increments('id')
      t.string('flat').notNullable()
      t.string('name').notNullable()
      t.string('category').notNullable()
      t.string('title').notNullable()
      t.text('description')
      t.string('priority').defaultTo('medium')
      t.string('status').defaultTo('open')
      t.text('note')
      t.string('created_at')
      t.string('updated_at')
    })
  }

  // VISITORS
  const hasVisitors = await knex.schema.hasTable('visitors')
  if (!hasVisitors) {
    await knex.schema.createTable('visitors', t => {
      t.increments('id')
      t.string('name').notNullable()
      t.string('flat').notNullable()
      t.string('purpose')
      t.string('phone')
      t.string('time_in')
      t.string('time_out')
      t.string('guard')
      t.string('status').defaultTo('pending')
      t.string('date')
    })
  }

  // NOTICES
  const hasNotices = await knex.schema.hasTable('notices')
  if (!hasNotices) {
    await knex.schema.createTable('notices', t => {
      t.increments('id')
      t.string('title').notNullable()
      t.text('body')
      t.string('type').defaultTo('info')
      t.string('created_by')
      t.string('created_at')
    })
  }

  // EVENTS
  const hasEvents = await knex.schema.hasTable('events')
  if (!hasEvents) {
    await knex.schema.createTable('events', t => {
      t.increments('id')
      t.string('title').notNullable()
      t.string('date')
      t.string('time')
      t.string('location')
      t.integer('capacity').defaultTo(50)
      t.integer('rsvp').defaultTo(0)
      t.string('category').defaultTo('general')
      t.text('description')
      t.string('created_at')
    })
  }

  // FINANCES
  const hasFinances = await knex.schema.hasTable('finances')
  if (!hasFinances) {
    await knex.schema.createTable('finances', t => {
      t.increments('id')
      t.string('type').notNullable()
      t.string('category')
      t.text('description')
      t.float('amount')
      t.string('date')
      t.string('approved_by')
      t.string('created_at')
    })
  }

  // CCTV
  const hasCctv = await knex.schema.hasTable('cctv')
  if (!hasCctv) {
    await knex.schema.createTable('cctv', t => {
      t.increments('id')
      t.string('incident_date')
      t.string('camera')
      t.string('time')
      t.text('incident')
      t.string('reporter')
      t.boolean('restricted').defaultTo(false)
      t.string('status').defaultTo('pending')
      t.string('created_at')
    })
  }
}

module.exports = { knex, initDB }