# Tazaker - Testing Documentation
## Hospital Queue Management System

Complete testing guide for ensuring quality and reliability of the Hospital Queue Management System.

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [API Testing](#api-testing)
7. [Load Testing](#load-testing)
8. [Security Testing](#security-testing)
9. [Manual Testing Checklist](#manual-testing-checklist)
10. [Bug Reporting](#bug-reporting)

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /----\     Integration Tests (30%)
     /------\    Unit Tests (60%)
    /--------\
```

### Testing Levels

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test API endpoints and database operations
3. **End-to-End Tests** - Test complete user flows
4. **Load Tests** - Test system under high load
5. **Security Tests** - Test for vulnerabilities

---

## Test Environment Setup

### Backend Testing Setup

```bash
cd backend

# Install test dependencies
npm install --save-dev jest supertest @types/jest

# Install additional tools
npm install --save-dev faker @faker-js/faker
```

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js',
  ],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  verbose: true,
  testTimeout: 10000,
};
```

Update `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```

### Frontend Testing Setup

```bash
cd frontend

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev vitest @vitest/ui jsdom
```

Create `frontend/vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
```

---

## Unit Testing

### Backend Unit Tests

#### Example: Testing Utility Functions

Create `backend/src/utils/__tests__/validators.test.js`:

```javascript
const { validatePhone, validateEmail, validateNationalId } = require('../validators');

describe('Validators', () => {
  describe('validatePhone', () => {
    test('should validate Saudi phone numbers', () => {
      expect(validatePhone('+966501234567')).toBe(true);
      expect(validatePhone('0501234567')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhone('123')).toBe(false);
      expect(validatePhone('abc')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validateNationalId', () => {
    test('should validate 10-digit national IDs', () => {
      expect(validateNationalId('1234567890')).toBe(true);
    });

    test('should reject invalid national IDs', () => {
      expect(validateNationalId('123')).toBe(false);
      expect(validateNationalId('abc')).toBe(false);
    });
  });
});
```

#### Example: Testing Models

Create `backend/src/models/__tests__/Ticket.test.js`:

```javascript
const Ticket = require('../Ticket');
const { query } = require('../../config/database');

jest.mock('../../config/database');

describe('Ticket Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('should create a new ticket', async () => {
      const mockTicket = {
        ticket_id: 1,
        ticket_number: 'A-001',
        status: 'waiting',
      };

      query.mockResolvedValue({ rows: [mockTicket] });

      const result = await Ticket.create({
        ticket_number: 'A-001',
        clinic_id: 1,
        patient_id: 1,
      });

      expect(result).toEqual(mockTicket);
      expect(query).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    test('should find ticket by ID', async () => {
      const mockTicket = { ticket_id: 1, status: 'waiting' };
      query.mockResolvedValue({ rows: [mockTicket] });

      const result = await Ticket.findById(1);

      expect(result).toEqual(mockTicket);
    });

    test('should return null if ticket not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const result = await Ticket.findById(999);

      expect(result).toBeNull();
    });
  });
});
```

### Frontend Unit Tests

#### Example: Testing Components

Create `frontend/src/components/common/__tests__/Button.test.jsx`:

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button Component', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByText(/جاري التحميل/)).toBeInTheDocument();
  });
});
```

#### Example: Testing Redux Slices

Create `frontend/src/store/slices/__tests__/authSlice.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, clearCredentials } from '../authSlice';

describe('authSlice', () => {
  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should handle setCredentials', () => {
    const credentials = {
      user: { id: 1, username: 'test' },
      accessToken: 'token123',
      refreshToken: 'refresh123',
    };

    const actual = authReducer(undefined, setCredentials(credentials));

    expect(actual.user).toEqual(credentials.user);
    expect(actual.accessToken).toBe('token123');
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle clearCredentials', () => {
    const initialState = {
      user: { id: 1 },
      accessToken: 'token',
      isAuthenticated: true,
    };

    const actual = authReducer(initialState, clearCredentials());

    expect(actual.user).toBeNull();
    expect(actual.accessToken).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });
});
```

---

## Integration Testing

### API Integration Tests

Create `backend/tests/integration/auth.test.js`:

```javascript
const request = require('supertest');
const app = require('../../src/app');
const { query } = require('../../src/config/database');

describe('Authentication API', () => {
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'Admin@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    let accessToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'admin', password: 'Admin@123' });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('username');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
    });
  });
});
```

### Database Integration Tests

Create `backend/tests/integration/database.test.js`:

```javascript
const { query } = require('../../src/config/database');

describe('Database Connection', () => {
  it('should connect to database', async () => {
    const result = await query('SELECT 1 as test');
    expect(result.rows[0].test).toBe(1);
  });

  it('should handle transactions', async () => {
    await query('BEGIN');

    const insertResult = await query(
      'INSERT INTO test_table (name) VALUES ($1) RETURNING *',
      ['test']
    );

    await query('ROLLBACK');

    expect(insertResult.rows).toHaveLength(1);
  });
});
```

---

## End-to-End Testing

### Using Playwright

Install Playwright:

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

Create `frontend/e2e/login.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'Admin@123');

    // Click login button
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');

    // Verify dashboard is loaded
    await expect(page.locator('h1')).toContainText('Welcome');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('.error')).toBeVisible();
  });
});
```

Create `frontend/e2e/ticket-flow.spec.js`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Ticket Issuance Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'receptionist1');
    await page.fill('input[name="password"]', 'Recept@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should issue a new ticket', async ({ page }) => {
    // Navigate to tickets page
    await page.click('a[href="/tickets"]');

    // Click new ticket button
    await page.click('button:has-text("إصدار تذكرة")');

    // Select patient
    await page.click('.patient-item:first-child');
    await page.click('button:has-text("التالي")');

    // Select clinic
    await page.click('.clinic-item:first-child');

    // Submit
    await page.click('button:has-text("إصدار التذكرة")');

    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
```

---

## API Testing

### Using Postman/Thunder Client

#### Authentication Tests

**1. Login**
```
POST http://localhost:5000/api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}

Expected: 200 OK with accessToken and refreshToken
```

**2. Get Profile**
```
GET http://localhost:5000/api/v1/auth/profile
Authorization: Bearer {accessToken}

Expected: 200 OK with user data
```

#### Ticket Tests

**1. Create Ticket**
```
POST http://localhost:5000/api/v1/tickets
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "clinic_id": 1,
  "patient_id": 1,
  "priority": 0
}

Expected: 201 Created with ticket details
```

**2. Get Clinic Queue**
```
GET http://localhost:5000/api/v1/tickets/clinic/1/queue?status=waiting
Authorization: Bearer {accessToken}

Expected: 200 OK with array of tickets
```

**3. Call Next Patient**
```
POST http://localhost:5000/api/v1/tickets/clinic/1/call-next
Authorization: Bearer {accessToken}

Expected: 200 OK with called ticket
```

---

## Load Testing

### Using Artillery

Install Artillery:

```bash
npm install -g artillery
```

Create `load-test.yml`:

```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  payload:
    path: "./users.csv"
    fields:
      - username
      - password

scenarios:
  - name: "Login and create ticket"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            username: "{{ username }}"
            password: "{{ password }}"
          capture:
            json: "$.data.accessToken"
            as: "token"

      - post:
          url: "/api/v1/tickets"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            clinic_id: 1
            patient_id: 1
            priority: 0
```

Run load test:

```bash
artillery run load-test.yml
```

---

## Security Testing

### OWASP Top 10 Tests

#### 1. SQL Injection

```bash
# Test SQL injection in login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything"}'

# Should return 401, not 200
```

#### 2. XSS (Cross-Site Scripting)

```bash
# Test XSS in ticket notes
curl -X POST http://localhost:5000/api/v1/tickets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clinic_id":1,"patient_id":1,"notes":"<script>alert('\''XSS'\'')</script>"}'

# Should sanitize the input
```

#### 3. Authentication Bypass

```bash
# Try accessing protected route without token
curl http://localhost:5000/api/v1/tickets

# Should return 401 Unauthorized
```

#### 4. Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}' &
done

# Should trigger rate limiting after threshold
```

---

## Manual Testing Checklist

### Authentication Module

- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Logout functionality
- [ ] Session expiry after timeout
- [ ] Refresh token works correctly
- [ ] Password change works
- [ ] Cannot access protected routes without auth

### Receptionist Interface

- [ ] Search for existing patient
- [ ] Register new patient
- [ ] Issue ticket with normal priority
- [ ] Issue ticket with high priority
- [ ] View today's tickets
- [ ] Ticket number generation is correct
- [ ] SMS sent after ticket issuance
- [ ] Cannot issue ticket for inactive clinic

### Doctor Interface

- [ ] View clinic queue
- [ ] Call next patient
- [ ] Start serving patient
- [ ] Complete service
- [ ] Mark patient as no-show
- [ ] Cancel ticket
- [ ] Cannot call next when already serving
- [ ] Queue updates in real-time

### Display Screen

- [ ] Shows current ticket number
- [ ] Shows waiting queue
- [ ] Updates automatically when patient called
- [ ] Sound plays when patient called
- [ ] Can be accessed without authentication
- [ ] Works on large screen/TV
- [ ] Updates every 30 seconds (fallback)

### Admin Dashboard

- [ ] View daily statistics
- [ ] View clinic performance
- [ ] View doctor performance
- [ ] Charts render correctly
- [ ] Date range filter works
- [ ] Export functionality works
- [ ] Real-time updates work

### WebSocket Functionality

- [ ] Connection established on login
- [ ] Receives ticket:created events
- [ ] Receives patient:called events
- [ ] Receives queue:updated events
- [ ] Reconnects after disconnect
- [ ] Multiple tabs sync correctly

### Bilingual Support

- [ ] Can switch between Arabic and English
- [ ] RTL layout works for Arabic
- [ ] All text is translated
- [ ] Date/time formats are localized
- [ ] Language preference persists

### Responsive Design

- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Navigation menu works on mobile
- [ ] All features accessible on mobile

---

## Bug Reporting

### Bug Report Template

```markdown
**Bug Title:** Brief description

**Environment:**
- OS: [e.g., Ubuntu 20.04]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.17.0]
- Database: [e.g., PostgreSQL 15.2]

**Steps to Reproduce:**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Screenshots:**
If applicable

**Logs:**
Relevant error logs

**Severity:**
- [ ] Critical (System crash, data loss)
- [ ] High (Major feature broken)
- [ ] Medium (Minor feature broken)
- [ ] Low (Cosmetic issue)
```

---

## Test Coverage Goals

### Backend
- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **Critical Paths**: 100% coverage

### Frontend
- **Components**: > 70% coverage
- **Redux Slices**: > 90% coverage
- **Critical Flows**: 100% coverage

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: tazaker_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: tazaker_test
          DB_USER: test_user
          DB_PASSWORD: test_pass
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run tests
        run: cd frontend && npm test

      - name: Build
        run: cd frontend && npm run build
```

---

## Performance Testing

### Key Metrics to Monitor

1. **Response Times**
   - API endpoints: < 200ms (p95)
   - Database queries: < 50ms (p95)
   - WebSocket latency: < 100ms

2. **Throughput**
   - Tickets per second: > 100
   - Concurrent WebSocket connections: > 1000
   - API requests per second: > 500

3. **Resource Usage**
   - CPU usage: < 70%
   - Memory usage: < 80%
   - Database connections: < 80% of max

---

## Test Data Management

### Seed Data for Testing

Create `backend/tests/seeds/test-data.sql`:

```sql
-- Test users
INSERT INTO users (username, password, role, full_name) VALUES
('test_admin', '$2b$10$...', 'admin', 'Test Admin'),
('test_doctor', '$2b$10$...', 'doctor', 'Test Doctor'),
('test_receptionist', '$2b$10$...', 'receptionist', 'Test Receptionist');

-- Test clinics
INSERT INTO clinics (clinic_name_ar, clinic_name_en, clinic_code) VALUES
('العيادة التجريبية', 'Test Clinic', 'TEST-01');

-- Test patients
INSERT INTO patients (full_name, national_id, phone) VALUES
('Test Patient 1', '1234567890', '+966501234567'),
('Test Patient 2', '0987654321', '+966507654321');
```

---

## Conclusion

This testing documentation provides a comprehensive guide for ensuring the quality and reliability of the Tazaker Hospital Queue Management System. Regular testing at all levels ensures a robust and bug-free application.

For questions or issues, please refer to the [INSTALLATION.md](./INSTALLATION.md) or create an issue on GitHub.

---

**Last Updated**: 2024
**Version**: 1.0.0
