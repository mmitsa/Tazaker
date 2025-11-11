# Tazaker Frontend - Hospital Queue Management System

Modern, responsive, and bilingual (Arabic/English) frontend for the Hospital Queue Management System.

## 🚀 Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router v6** - Client-side routing
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client with interceptors
- **i18next** - Internationalization (Arabic/English)
- **React Hot Toast** - Beautiful toast notifications
- **Recharts** - Chart library for analytics
- **Framer Motion** - Animation library
- **React Icons** - Icon library

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable React components
│   ├── pages/          # Page components
│   ├── layouts/        # Layout components (MainLayout, AuthLayout)
│   ├── services/       # API services and WebSocket
│   ├── store/          # Redux store and slices
│   │   └── slices/     # Redux slices (auth, tickets, clinics, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles and Tailwind CSS
│   ├── i18n/           # Internationalization
│   │   └── locales/    # Translation files (ar.json, en.json)
│   ├── App.jsx         # Main App component
│   └── main.jsx        # Application entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── package.json        # Dependencies
├── .env.example        # Environment variables template
└── README.md           # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on port 5000 (or update VITE_API_URL)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_DEFAULT_LANGUAGE=ar
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The build files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 🌐 Internationalization (i18n)

The application supports Arabic (RTL) and English (LTR) languages.

- **Default Language**: Arabic (can be changed in `.env`)
- **Translation Files**: `src/i18n/locales/ar.json` and `src/i18n/locales/en.json`
- **Language Switching**: Automatically updates HTML `dir` and `lang` attributes
- **RTL Support**: Full RTL layout support with Tailwind CSS

### Adding Translations

1. Add keys to both `ar.json` and `en.json` in `src/i18n/locales/`
2. Use in components:
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('common.appName')}</h1>;
}
```

## 🔌 API Services

All API calls are handled through service modules in `src/services/`:

- **authService** - Authentication (login, logout, refresh token)
- **ticketService** - Ticket management
- **clinicService** - Clinic management
- **patientService** - Patient management
- **doctorService** - Doctor management
- **reportService** - Reports and analytics
- **socketService** - WebSocket real-time updates

### API Configuration

The Axios instance (`src/services/api.js`) includes:
- Automatic JWT token injection
- Token refresh on 401 errors
- Error handling and interceptors
- Base URL configuration from environment

## 🔄 Real-time Updates (WebSocket)

The application uses Socket.IO for real-time updates:

- **Auto-connect**: Connects when user is authenticated
- **Room Subscriptions**: Subscribe to clinic-specific updates
- **Event Listeners**:
  - `ticket:created` - New ticket created
  - `patient:called` - Patient called to doctor
  - `service:completed` - Service completed
  - `ticket:status_changed` - Ticket status changed
  - `queue:updated` - Queue updated
  - `doctor:status_changed` - Doctor status changed
  - `clinic:status_changed` - Clinic status changed

### Usage Example

```javascript
import socketService from '@services/socketService';

// Subscribe to clinic updates
socketService.subscribeToClinic(clinicId);

// Unsubscribe
socketService.unsubscribeFromClinic(clinicId);
```

## 🎨 Styling

### Tailwind CSS

The project uses Tailwind CSS with custom configuration:

- **Custom Colors**: Primary, secondary, success, danger, warning
- **Arabic Font**: Cairo and Tajawal fonts for RTL
- **Custom Components**: Pre-built button, card, input, badge, and table styles
- **Animations**: Fade-in, slide-in animations
- **RTL Support**: Full right-to-left layout support

### Custom CSS Classes

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-success">Success Button</button>
<button class="btn btn-danger">Danger Button</button>

<!-- Cards -->
<div class="card">Card Content</div>
<div class="card card-hover">Card with Hover</div>

<!-- Inputs -->
<input class="input" type="text" />
<input class="input input-error" type="text" />

<!-- Badges -->
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>

<!-- Status Indicators -->
<span class="status-dot status-waiting"></span>
<span class="status-dot status-serving"></span>
<span class="status-dot status-completed"></span>
```

## 🗂️ State Management

Redux Toolkit is used for state management:

### Store Structure

```javascript
{
  auth: {
    user: {...},
    accessToken: '...',
    isAuthenticated: true
  },
  tickets: {
    tickets: [...],
    currentTicket: {...}
  },
  clinics: {
    clinics: [...]
  },
  patients: {
    patients: [...]
  },
  doctors: {
    doctors: [...]
  },
  queue: {
    currentServing: {...},
    waitingQueue: [...]
  }
}
```

### Usage Example

```javascript
import { useSelector, useDispatch } from 'react-redux';
import { login, selectIsAuthenticated } from '@store/slices/authSlice';

function LoginForm() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleLogin = () => {
    dispatch(login({ username, password }));
  };

  return ...;
}
```

## 🔐 Authentication

Authentication flow:

1. User logs in with username/password
2. Access token and refresh token are stored in localStorage
3. Access token is automatically added to API requests
4. On 401 error, refresh token is used to get new access token
5. If refresh fails, user is logged out

## 📱 Responsive Design

The application is fully responsive:

- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+
- **Large Desktop**: 1440px+

Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

## 🎯 User Roles & Interfaces

Different interfaces for different roles:

1. **Receptionist** - Issue tickets, register patients
2. **Doctor** - View queue, call patients, manage consultations
3. **Admin** - View reports, manage system
4. **Display Screen** - Show current queue status in waiting area

## 📊 Features to be Implemented

- [ ] Login/Logout pages
- [ ] Dashboard with statistics
- [ ] Receptionist interface (ticket issuance)
- [ ] Doctor interface (queue management)
- [ ] Display screen (real-time queue display)
- [ ] Patient management (CRUD)
- [ ] Clinic management
- [ ] Reports and analytics
- [ ] Settings page
- [ ] Profile management

## 🧪 Testing

```bash
# Run linter
npm run lint
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tazaker/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

- Development Team

## 📞 Support

For support, contact: support@tazaker.com
