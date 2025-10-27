# GHL Voice AI Agent Planner

A comprehensive web application for planning, configuring, and deploying GoHighLevel Voice AI agents. Built with React, TypeScript, and modern web technologies.

## 🚀 Features

### Core Modules
- **Voice AI Configuration Builder** - Configure AI agents with personas, scripts, and behavior settings
- **Workflow Automation Designer** - Drag-and-drop workflow builder for call flows
- **Phone System Manager** - Manage phone numbers, IVR menus, and call routing
- **Custom Fields & Values Manager** - Define custom data fields for contacts and opportunities
- **Integration Setup** - Connect external services (OpenAI, ElevenLabs, Twilio, etc.)
- **Compliance & Risk Checker** - Ensure regulatory compliance (TCPA, GDPR, DNC)
- **Testing Simulator** - Test voice agents before deployment
- **Template Library** - Pre-built templates for different industries
- **Analytics & Costing** - Track performance and calculate costs
- **Export Center** - Export configurations in JSON and Markdown formats

### Technical Features
- **Modern UI/UX** - Clean, responsive design with dark mode support
- **Type Safety** - Full TypeScript implementation
- **State Management** - Zustand for efficient state management
- **Local Storage** - Persistent data storage
- **Modular Architecture** - Component-based design
- **Real-time Updates** - Live configuration updates

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS3 with CSS Variables for theming
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Build Tool**: Vite

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ghl-voice-ai-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   └── modules/
│       ├── VoiceAgentBuilder.tsx
│       ├── WorkflowDesigner.tsx
│       ├── PhoneSystemManager.tsx
│       ├── CustomFieldsManager.tsx
│       ├── IntegrationSetup.tsx
│       ├── ComplianceChecker.tsx
│       ├── TestingSimulator.tsx
│       ├── TemplateLibrary.tsx
│       ├── AnalyticsDashboard.tsx
│       └── ExportCenter.tsx
├── store/
│   └── useStore.ts
├── types/
│   └── index.ts
├── styles/
│   └── globals.css
├── App.tsx
└── main.tsx
```

## 🎯 Usage

### Creating a Voice Agent

1. Navigate to the "Voice Agents" module
2. Click "New Agent" to create a new voice agent
3. Configure the agent's persona, voice provider, and scripts
4. Save the configuration

### Designing Workflows

1. Go to the "Workflows" module
2. Create a new workflow or select an existing one
3. Add nodes from the palette to build your call flow
4. Connect nodes to create the workflow logic

### Managing Phone System

1. Access the "Phone System" module
2. Add phone numbers and configure routing rules
3. Set up IVR menus and business hours
4. Configure call handling preferences

### Custom Fields

1. Navigate to "Custom Fields" module
2. Define custom fields for contacts, opportunities, or companies
3. Set up custom values and groups
4. Configure field validation rules

### Integrations

1. Go to "Integrations" module
2. Connect external services (OpenAI, ElevenLabs, etc.)
3. Configure API keys and settings
4. Test connections

### Compliance

1. Access "Compliance" module
2. Review TCPA, GDPR, and DNC compliance status
3. Configure consent scripts
4. Set up compliance monitoring

### Testing

1. Navigate to "Testing" module
2. Select a voice agent and workflow
3. Start a test call simulation
4. Review performance metrics

### Analytics

1. Go to "Analytics" module
2. View performance metrics and costs
3. Track call volumes and success rates
4. Monitor ROI and efficiency

### Export

1. Access "Export Center"
2. Choose export format (JSON, Markdown)
3. Select data to include
4. Download or share configurations

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_APP_NAME=GHL Voice AI Agent Planner
VITE_APP_VERSION=1.0.0
```

### Customization

The application uses CSS variables for theming. You can customize colors in `src/styles/globals.css`:

```css
:root {
  --primary: #3b82f6;
  --secondary: #f1f5f9;
  /* ... other variables */
}
```

## 📊 Data Models

The application uses comprehensive TypeScript interfaces for data modeling:

- `VoiceAgent` - Voice agent configuration
- `Workflow` - Workflow definitions with nodes and edges
- `PhoneNumber` - Phone number and routing configuration
- `CustomField` - Custom field definitions
- `Integration` - External service integrations
- `ComplianceSettings` - Compliance and risk settings
- `Template` - Pre-built templates
- `AnalyticsSnapshot` - Performance metrics

## 🚀 Deployment

### Vercel
```bash
npm run build
# Deploy dist folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core modules
- **v1.1.0** - Added advanced workflow designer
- **v1.2.0** - Enhanced analytics and reporting
- **v1.3.0** - Added template library and compliance checker

---

Built with ❤️ for GoHighLevel Voice AI Agent development
