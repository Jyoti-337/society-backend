const express = require('express')
const cors = require('cors')
const { knex, initDB } = require('./database')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const SECRET = process.env.JWT_SECRET || 'society_secret_2025'
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: '*',
  credentials: true
}))
app.use(express.json())

const UNIQUE_ROLES = ['admin', 'chairman', 'secretary', 'treasurer', 'security']

const ROLE_LABELS = {
  admin: 'Admin', chairman: 'Chairman', secretary: 'Secretary',
  treasurer: 'Treasurer', security: 'Watchman', resident: 'Resident'
}

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try { req.user = jwt.verify(token, SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid or expired token' }) }
}

const adminOnly = (req, res, next) => {
  if (!['admin', 'chairman', 'secretary'].includes(req.user?.role))
    return res.status(403).json({ error: 'Admin access required' })
  next()
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, flat, phone, status, role } = req.body

    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' })

    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const existing = await knex('users').where({ email: email.toLowerCase().trim() }).first()
    if (existing)
      return res.status(400).json({ error: 'An account with this email already exists' })

    const assignedRole = (role || 'resident').toLowerCase().trim()

    const validRoles = ['admin', 'chairman', 'secretary', 'treasurer', 'security', 'resident']
    if (!validRoles.includes(assignedRole))
      return res.status(400).json({ error: 'Invalid role selected' })

    if (UNIQUE_ROLES.includes(assignedRole)) {
      const roleOwner = await knex('users').where({ role: assignedRole }).first()
      if (roleOwner) {
        const label = ROLE_LABELS[assignedRole] || assignedRole
        return res.status(400).json({
          error: `${label} role is already assigned to another user. This role can only be held by one person at a time.`
        })
      }
    }

    const hash = bcrypt.hashSync(password, 10)
    const now = new Date().toISOString()

    const [id] = await knex('users').insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role: assignedRole,
      flat: flat?.trim() || null,
      phone: phone?.trim() || null,
      status: status || 'owner',
      created_at: now,
      updated_at: now
    })

    const memberRole = ROLE_LABELS[assignedRole] || 'Resident'
    await knex('members').insert({
      name: name.trim(),
      flat: flat?.trim() || 'TBD',
      role: memberRole,
      phone: phone?.trim() || null,
      email: email.toLowerCase().trim(),
      status: status || 'owner',
      since: new Date().getFullYear().toString()
    })

    res.json({ success: true, id, message: 'Account created successfully' })
  } catch (e) {
    console.error('Register error:', e.message)
    res.status(500).json({ error: 'Registration failed: ' + e.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' })

    const user = await knex('users').where({ email: email.toLowerCase().trim() }).first()
    if (!user)
      return res.status(400).json({ error: 'No account found with this email' })

    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Incorrect password' })

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, flat: user.flat, email: user.email },
      SECRET, { expiresIn: '7d' }
    )

    const { password: _, ...safeUser } = user
    res.json({ token, user: safeUser })
  } catch (e) {
    console.error('Login error:', e.message)
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await knex('users').where({ id: req.user.id }).first()
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { password, ...safeUser } = user
    res.json(safeUser)
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

app.put('/api/auth/me', auth, async (req, res) => {
  try {
    const { name, phone, flat } = req.body
    const now = new Date().toISOString()
    await knex('users').where({ id: req.user.id }).update({
      name: name?.trim(), phone: phone?.trim(), flat: flat?.trim(), updated_at: now
    })
    await knex('members').where({ email: req.user.email }).update({
      name: name?.trim(), phone: phone?.trim(), flat: flat?.trim()
    })
    const updated = await knex('users').where({ id: req.user.id }).first()
    const { password, ...safeUser } = updated
    res.json(safeUser)
  } catch (e) {
    res.status(500).json({ error: 'Update failed' })
  }
})

app.delete('/api/auth/me', auth, async (req, res) => {
  try {
    const { password } = req.body
    const user = await knex('users').where({ id: req.user.id }).first()
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Incorrect password. Account not deleted.' })

    await knex('users').where({ id: req.user.id }).del()
    await knex('members').where({ email: user.email }).del()

    const label = ROLE_LABELS[user.role] || user.role
    res.json({
      success: true,
      message: `Account deleted. ${UNIQUE_ROLES.includes(user.role) ? `${label} role is now available for registration.` : ''}`
    })
  } catch (e) {
    res.status(500).json({ error: 'Deletion failed' })
  }
})

app.get('/api/auth/check-role/:role', async (req, res) => {
  try {
    const role = req.params.role.toLowerCase().trim()
    if (!UNIQUE_ROLES.includes(role)) return res.json({ available: true, role })
    const existing = await knex('users').where({ role }).first()
    res.json({ available: !existing, role, takenBy: existing ? existing.name : null })
  } catch (e) {
    res.json({ available: true, role: req.params.role })
  }
})

app.get('/api/users', auth, adminOnly, async (req, res) => {
  const users = await knex('users')
    .select('id','name','email','role','flat','phone','status','created_at')
    .orderBy('created_at', 'desc')
  res.json(users)
})

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const target = await knex('users').where({ id: req.params.id }).first()
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.id === req.user.id)
      return res.status(400).json({ error: 'Use /api/auth/me to delete your own account' })

    await knex('users').where({ id: req.params.id }).del()
    await knex('members').where({ email: target.email }).del()

    const label = ROLE_LABELS[target.role] || target.role
    res.json({
      success: true,
      message: `${target.name}'s account deleted.${UNIQUE_ROLES.includes(target.role) ? ` ${label} role is now available.` : ''}`
    })
  } catch (e) {
    res.status(500).json({ error: 'Deletion failed' })
  }
})

app.get('/api/dashboard', auth, async (req, res) => {
  try {
    const residents = await knex('members').count('id as count').first()
    const complaints = await knex('complaints').where({ status: 'open' }).count('id as count').first()
    const collection = await knex('payments').where({ status: 'paid' }).sum('amount as total').first()
    const today = new Date().toISOString().split('T')[0]
    const visitorsToday = await knex('visitors').where({ date: today }).count('id as count').first()
    res.json({
      residents: residents.count || 0,
      complaints: complaints.count || 0,
      collection: collection.total || 0,
      visitorsToday: visitorsToday.count || 0
    })
  } catch (e) {
    res.json({ residents: 0, complaints: 0, collection: 0, visitorsToday: 0 })
  }
})

app.get('/api/members', auth, async (req, res) => {
  res.json(await knex('members').orderBy('id'))
})
app.post('/api/members', auth, async (req, res) => {
  const [id] = await knex('members').insert(req.body)
  res.json({ id, ...req.body })
})
app.delete('/api/members/:id', auth, async (req, res) => {
  await knex('members').where({ id: req.params.id }).del()
  res.json({ success: true })
})

app.get('/api/payments', auth, async (req, res) => {
  res.json(await knex('payments').orderBy('id', 'desc'))
})
app.post('/api/payments', auth, async (req, res) => {
  const txn_id = 'TXN' + Date.now()
  const [id] = await knex('payments').insert({
    ...req.body, status: 'paid', txn_id,
    paid_at: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  })
  res.json({ success: true, txn_id, id })
})

app.get('/api/complaints', auth, async (req, res) => {
  res.json(await knex('complaints').orderBy('id', 'desc'))
})
app.post('/api/complaints', auth, async (req, res) => {
  const [id] = await knex('complaints').insert({ ...req.body, created_at: new Date().toISOString() })
  res.json({ success: true, id })
})
app.put('/api/complaints/:id', auth, async (req, res) => {
  await knex('complaints').where({ id: req.params.id }).update({ ...req.body, updated_at: new Date().toISOString() })
  res.json({ success: true })
})

app.get('/api/visitors/all', auth, async (req, res) => {
  res.json(await knex('visitors').orderBy('id', 'desc').limit(100))
})
app.post('/api/visitors', auth, async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const timeIn = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const [id] = await knex('visitors').insert({ ...req.body, time_in: timeIn, status: 'pending', date: today })
  res.json({ success: true, id })
})
app.put('/api/visitors/:id/approve', auth, async (req, res) => {
  await knex('visitors').where({ id: req.params.id }).update({ status: req.body.status })
  res.json({ success: true })
})
app.put('/api/visitors/:id/checkout', auth, async (req, res) => {
  const timeOut = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  await knex('visitors').where({ id: req.params.id }).update({ time_out: timeOut, status: 'approved' })
  res.json({ success: true })
})

app.get('/api/notices', auth, async (req, res) => {
  res.json(await knex('notices').orderBy('id', 'desc'))
})
app.post('/api/notices', auth, async (req, res) => {
  const [id] = await knex('notices').insert({ ...req.body, created_at: new Date().toISOString() })
  res.json({ success: true, id })
})
app.delete('/api/notices/:id', auth, async (req, res) => {
  await knex('notices').where({ id: req.params.id }).del()
  res.json({ success: true })
})

app.get('/api/events', auth, async (req, res) => {
  res.json(await knex('events').orderBy('date'))
})
app.post('/api/events', auth, async (req, res) => {
  const [id] = await knex('events').insert({ ...req.body, created_at: new Date().toISOString() })
  res.json({ success: true, id })
})
app.put('/api/events/:id/rsvp', auth, async (req, res) => {
  await knex('events').where({ id: req.params.id }).increment('rsvp', 1)
  res.json({ success: true })
})
app.delete('/api/events/:id', auth, async (req, res) => {
  await knex('events').where({ id: req.params.id }).del()
  res.json({ success: true })
})

app.get('/api/finances', auth, async (req, res) => {
  res.json(await knex('finances').orderBy('date', 'desc'))
})
app.get('/api/finances/summary', auth, async (req, res) => {
  const income = await knex('finances').where({ type: 'income' }).sum('amount as total').first()
  const expense = await knex('finances').where({ type: 'expense' }).sum('amount as total').first()
  const byCategory = await knex('finances').where({ type: 'expense' }).groupBy('category').select('category').sum('amount as total')
  res.json({
    income: income.total || 0,
    expense: expense.total || 0,
    balance: (income.total || 0) - (expense.total || 0),
    byCategory
  })
})
app.post('/api/finances', auth, async (req, res) => {
  const [id] = await knex('finances').insert({ ...req.body, created_at: new Date().toISOString() })
  res.json({ success: true, id })
})

app.get('/api/cctv', auth, async (req, res) => {
  res.json(await knex('cctv').orderBy('id', 'desc'))
})
app.post('/api/cctv', auth, async (req, res) => {
  const [id] = await knex('cctv').insert({ ...req.body, created_at: new Date().toISOString() })
  res.json({ success: true, id })
})

initDB().then(() => {
  console.log('✅ Database ready')
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
}).catch(e => {
  console.error('DB init failed:', e.message)
  process.exit(1)
})