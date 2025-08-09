# HR Evaluation System

A comprehensive Human Resources evaluation and management platform built with React, TypeScript, and modern web technologies. This system streamlines employee evaluation processes, performance tracking, and HR management tasks with role-based access control.

## 🆕 Recent Updates

- **✅ Company Management**: Complete company management system with creation, listing, and detailed profiles
- **✅ Enhanced API Integration**: Full backend connectivity with comprehensive error handling
- **✅ Improved Form Validation**: Client-side validation with real-time feedback
- **✅ TypeScript Enhancements**: Stronger type safety across all components
- **✅ UI/UX Improvements**: Enhanced user interface with better loading states
- **✅ Debugging Tools**: Advanced debugging capabilities for evaluation system
- **✅ Role-based Navigation**: Dynamic sidebar navigation based on user permissions

## 🚀 Features

### Core Functionality
- **Employee Management**: Complete employee profile management with search and filtering capabilities
- **Company Management**: Comprehensive company profile management with industry categorization
- **Performance Evaluations**: Comprehensive evaluation system with scoring and review tracking
- **Dashboard Analytics**: Real-time insights and performance metrics
- **Department Management**: Organize and manage company departments
- **Role-Based Access Control**: Secure access with different permission levels

### User Roles
- **Admin**: Full system access and administrative tools
- **HR Manager**: Employee and evaluation management
- **Department Manager**: Team oversight and evaluation capabilities
- **Employee**: Personal dashboard and evaluation access

### Key Features
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Real-time Updates**: Live data synchronization and instant UI updates
- **Advanced Filtering**: Search and filter employees by various criteria
- **Modal-based Forms**: Intuitive add/edit functionality for all entities
- **Status Management**: Employee activation/deactivation toggles
- **Professional UI**: Modern design with shadcn/ui components
- **Multi-entity Management**: Companies, employees, departments, and evaluations
- **Form Validation**: Comprehensive client-side validation with error handling
- **API Integration**: Full backend connectivity with error handling and loading states

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI component library
- **Radix UI** - Accessible component primitives

### State Management & Data
- **React Context API** - Authentication and global state
- **React Hooks** - Local state management
- **Custom Hooks** - Reusable API integration hooks
- **Axios** - HTTP client for API communication
- **Form Validation** - Client-side validation for data integrity

### Icons & Styling
- **Lucide React** - Beautiful icon library
- **Tailwind CSS** - Responsive design system
- **CSS Animations** - Smooth transitions and interactions

### API Integration
- **RESTful API** - Backend integration with comprehensive endpoints
- **Authentication** - JWT token-based authentication system
- **Error Handling** - Robust error handling and user feedback
- **Loading States** - Real-time loading indicators during API calls
- **Data Validation** - TypeScript interfaces for type-safe API communication

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HR-Evaluation-System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## 🔐 Demo Credentials

The application includes demo users for testing different role capabilities:

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| **Admin** | admin@company.com | password | Full system access |
| **HR Manager** | hr@company.com | password | Employee & evaluation management |
| **Department Manager** | manager@company.com | password | Team oversight & evaluations |

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and main layout
│   ├── employees/      # Employee management components
│   ├── companies/      # Company management components
│   ├── evaluations/    # Evaluation system components
│   ├── departments/    # Department management
│   └── ui/            # Reusable UI components
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions
├── pages/             # Main page components
└── constants/         # Application constants
```

## 🎯 Key Components

### Employee Management
- **EmployeeList**: Main employee listing with search and filters
- **EmployeeCard**: Individual employee display cards
- **EmployeeFilters**: Advanced filtering and search functionality
- **Add/Edit Modals**: Form-based employee management

### Company Management
- **CompanyList**: Comprehensive company listing and management
- **Company Creation**: Modal-based form for adding new companies
- **Company Profiles**: Detailed company information including industry, size, and contact details
- **Industry Categorization**: Organize companies by industry type
- **Size Classification**: Small, Medium, and Large company categorization

### Authentication
- **LoginPage**: Secure authentication with demo credentials
- **AuthContext**: Global authentication state management
- **Protected Routes**: Role-based access control

### Dashboard
- **DashboardHome**: Analytics and overview widgets
- **Header**: Navigation and user menu
- **Sidebar**: Collapsible navigation with role-based menu items

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI/UX Features

- **Dark/Light Mode**: Theme switching capability
- **Responsive Design**: Mobile-first approach
- **Accessibility**: WCAG compliant components
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Real-time feedback

## 🔧 Configuration

### Environment Setup
The application uses Vite for development and build processes. Configuration files:
- `vite.config.ts` - Vite configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration

### Customization
- **Themes**: Modify `src/index.css` for custom color schemes
- **Components**: Extend or customize UI components in `src/components/ui/`
- **Layouts**: Adjust dashboard layout in `src/components/dashboard/`

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔗 API Endpoints

The application integrates with a comprehensive backend API:

### Authentication
- `POST /api/auth/login/` - User authentication
- `POST /api/auth/refresh/` - Token refresh

### Companies
- `GET /api/org/companies/` - List all companies
- `POST /api/org/companies/create/` - Create new company
- `GET /api/org/companies/{id}/` - Get company details
- `PUT /api/org/companies/{id}/update/` - Update company
- `DELETE /api/org/companies/{id}/delete/` - Delete company

### Employees
- `GET /api/org/employees/` - List all employees
- `POST /api/org/employees/create/` - Create new employee
- `GET /api/org/employees/{id}/` - Get employee details
- `PUT /api/org/employees/{id}/update/` - Update employee
- `DELETE /api/org/employees/{id}/delete/` - Delete employee

### Departments
- `GET /api/org/departments/` - List all departments
- `POST /api/org/departments/create/` - Create new department
- `GET /api/org/departments/{id}/` - Get department details
- `PUT /api/org/departments/{id}/update/` - Update department
- `DELETE /api/org/departments/{id}/delete/` - Delete department

### Evaluations
- `GET /api/evaluations/` - List all evaluations
- `POST /api/evaluations/create/` - Create new evaluation
- `GET /api/evaluations/{id}/` - Get evaluation details
- `PUT /api/evaluations/{id}/update/` - Update evaluation
- `DELETE /api/evaluations/{id}/delete/` - Delete evaluation

## 🔒 Security Features

- **Role-based Access Control**: Different permissions for each user role
- **Protected Routes**: Authentication required for dashboard access
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive form validation and sanitization

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the demo credentials and features

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
#
