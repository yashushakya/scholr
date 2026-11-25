const request = require('supertest')
const app = require('../index')

// Helper — full signup flow with OTP
const signupUser = async (email, accountType = 'Student') => {
  // Step 1: Send OTP
  await request(app)
    .post('/api/v1/auth/sendotp')
    .send({ email })

  // Step 2: Get OTP from DB directly
  const OTP = require('../models/OTP')
  const otpDoc = await OTP.findOne({ email }).sort({ createdAt: -1 })
  const otp = otpDoc?.otp

  // Step 3: Signup with OTP
  const res = await request(app)
    .post('/api/v1/auth/signup')
    .send({
      firstName: 'Test',
      lastName: 'User',
      email,
      password: 'Test@1234',
      confirmPassword: 'Test@1234',
      accountType,
      otp
    })
  return res
}

describe('🔐 Auth Routes', () => {

  describe('POST /api/v1/auth/sendotp', () => {

    it('should send OTP to new email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/sendotp')
        .send({ email: 'newotp@test.com' })
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should not send OTP to already registered email', async () => {
      await signupUser('registered@test.com')
      const res = await request(app)
        .post('/api/v1/auth/sendotp')
        .send({ email: 'registered@test.com' })
      expect(res.statusCode).toBe(401)
    })
  })

  describe('POST /api/v1/auth/signup', () => {

    it('should register a new student successfully', async () => {
      const res = await signupUser('newstudent@test.com', 'Student')
      expect(res.statusCode).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should not register with mismatched passwords', async () => {
      // Send OTP first
      await request(app)
        .post('/api/v1/auth/sendotp')
        .send({ email: 'mismatch@test.com' })

      const OTP = require('../models/OTP')
      const otpDoc = await OTP.findOne({ email: 'mismatch@test.com' }).sort({ createdAt: -1 })

      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'mismatch@test.com',
          password: 'Test@1234',
          confirmPassword: 'WrongPass',
          accountType: 'Student',
          otp: otpDoc?.otp
        })
      expect(res.body.success).toBe(false)
    })

    it('should not register without OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'nootp@test.com',
          password: 'Test@1234',
          confirmPassword: 'Test@1234',
          accountType: 'Student'
        })
      expect(res.statusCode).toBe(403)
    })

    it('should not register duplicate email', async () => {
      await signupUser('duplicate@test.com')
      const res = await signupUser('duplicate@test.com')
      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/login', () => {

    beforeEach(async () => {
      await signupUser('logintest@test.com', 'Student')
    })

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'logintest@test.com', password: 'Test@1234' })
      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('token')
    })

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'logintest@test.com', password: 'WrongPass' })
      expect(res.statusCode).toBe(401)
    })

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@test.com', password: 'Test@1234' })
      expect(res.statusCode).toBe(401)
    })

    it('should reject missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'logintest@test.com' })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('Single-device login', () => {
    const creds = { email: 'single@test.com', password: 'Test@1234' }
    const login = (extra = {}) =>
      request(app).post('/api/v1/auth/login').send({ ...creds, ...extra })

    beforeEach(async () => {
      await signupUser(creds.email, 'Student')
    })

    it('should ask for confirmation when already logged in elsewhere', async () => {
      await login()
      const res = await login()
      expect(res.statusCode).toBe(409)
      expect(res.body.code).toBe('ALREADY_LOGGED_IN')
    })

    it('should not reveal session state for a wrong password', async () => {
      await login()
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: creds.email, password: 'wrong' })
      expect(res.statusCode).toBe(401)
    })

    it('forceLogout should invalidate the previous device token', async () => {
      const first = await login()
      const second = await login({ forceLogout: true })
      expect(second.statusCode).toBe(200)

      const old = await request(app)
        .post('/api/v1/auth/changepassword')
        .set('Authorization', `Bearer ${first.body.token}`)
        .send({ oldPassword: 'x', newPassword: 'y' })
      expect(old.statusCode).toBe(401)
      expect(old.body.code).toBe('SESSION_REPLACED')

      const current = await request(app)
        .post('/api/v1/auth/changepassword')
        .set('Authorization', `Bearer ${second.body.token}`)
        .send({ oldPassword: 'x', newPassword: 'y' })
      expect(current.body.code).not.toBe('SESSION_REPLACED')
    })

    it('logout should allow login from another device without prompt', async () => {
      const first = await login()
      const out = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${first.body.token}`)
      expect(out.statusCode).toBe(200)
      const again = await login()
      expect(again.statusCode).toBe(200)
    })
  })
})
