# Voice AI Platform - Testing Guide

## 🧪 End-to-End Testing Checklist

### Prerequisites
- [ ] Backend server running on port 10000
- [ ] Frontend running on port 3001
- [ ] Environment variables configured
- [ ] GHL OAuth app set up

---

## 1. Backend API Testing

### Health Check
```bash
curl http://localhost:10000/health
# Expected: {"status":"healthy","service":"GHL OAuth API"}
```

### GHL OAuth Flow
1. Navigate to `http://localhost:3001/ghl-api`
2. Click "Connect to GHL"
3. Complete OAuth authorization
4. Verify token storage in backend

### Voice AI Agent Creation
```bash
# Test agent creation
curl -X POST http://localhost:10000/api/voice-ai/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "description": "Test agent for validation",
    "voiceSettings": {
      "provider": "elevenlabs",
      "voiceId": "Adam",
      "speed": 1.0
    },
    "conversationSettings": {
      "systemPrompt": "You are a test agent",
      "temperature": 0.7
    }
  }'
```

### Template Loading
```bash
# Test template loading
curl http://localhost:10000/api/templates
# Expected: Array of template objects
```

### AI Generation
```bash
# Test AI agent generation
curl -X POST http://localhost:10000/api/voice-ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessDescription": "Fitness studio offering HIIT classes",
    "industry": "fitness",
    "businessType": "fitness-studio"
  }'
```

---

## 2. Frontend Component Testing

### GHL Voice AI Deployer
1. Navigate to `http://localhost:3001/ghl-deployer`
2. Test "Generate with AI" button
3. Fill out AI generation form
4. Verify agent generation
5. Test manual deployment
6. Check deployment status updates

### Cost Optimization Dashboard
1. Navigate to `http://localhost:3001/cost-optimization`
2. Verify cost data loading
3. Test agent filtering
4. Check optimization suggestions
5. Verify date range filtering

### Template Library
1. Navigate to `http://localhost:3001/templates`
2. Verify template loading
3. Test template selection
4. Check template details

---

## 3. Integration Testing

### GHL Integration
1. Create agent via frontend
2. Deploy to GHL
3. Verify agent appears in GHL dashboard
4. Test webhook configuration
5. Verify custom actions creation

### Cost Tracking
1. Make test calls to deployed agent
2. Check webhook events received
3. Verify cost recording
4. Check analytics dashboard

### Template System
1. Load F45 template
2. Generate agent from template
3. Deploy generated agent
4. Verify template customization

---

## 4. Error Handling Testing

### Network Errors
- Disconnect backend
- Test frontend error handling
- Verify graceful degradation

### API Errors
- Test with invalid API keys
- Test with malformed requests
- Verify error messages

### OAuth Errors
- Test with invalid credentials
- Test token expiration
- Verify refresh flow

---

## 5. Performance Testing

### Load Testing
```bash
# Test concurrent agent creation
for i in {1..10}; do
  curl -X POST http://localhost:10000/api/voice-ai/agents \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Agent '$i'","description":"Load test"}' &
done
```

### Memory Usage
- Monitor backend memory usage
- Check for memory leaks
- Verify garbage collection

---

## 6. Security Testing

### Webhook Security
1. Test webhook signature verification
2. Test with invalid signatures
3. Verify request validation

### OAuth Security
1. Test token storage security
2. Verify token refresh
3. Test scope validation

---

## 7. User Experience Testing

### Navigation
- Test all sidebar links
- Verify breadcrumbs
- Check responsive design

### Forms
- Test form validation
- Check error messages
- Verify success feedback

### Modals
- Test modal opening/closing
- Check modal content
- Verify modal interactions

---

## 8. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile
- [ ] Safari Mobile
- [ ] Firefox Mobile

---

## 9. Data Persistence Testing

### Local Storage
- Test Zustand persistence
- Verify data recovery
- Check storage limits

### Backend Storage
- Test token persistence
- Verify agent storage
- Check cost data persistence

---

## 10. Deployment Testing

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
- Test production environment
- Verify API endpoints
- Check error handling

---

## 🐛 Common Issues & Solutions

### Issue: OAuth Connection Fails
**Solution:**
1. Check GHL client ID/secret
2. Verify redirect URI
3. Check CORS settings

### Issue: Agent Deployment Fails
**Solution:**
1. Verify GHL token validity
2. Check agent configuration
3. Review API response

### Issue: Cost Tracking Not Working
**Solution:**
1. Check webhook configuration
2. Verify signature secret
3. Check webhook endpoint

### Issue: Templates Not Loading
**Solution:**
1. Check template file paths
2. Verify JSON format
3. Check file permissions

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

Backend API Tests:
[ ] Health check
[ ] OAuth flow
[ ] Agent creation
[ ] Template loading
[ ] AI generation

Frontend Tests:
[ ] GHL Deployer
[ ] Cost Optimization
[ ] Template Library
[ ] Navigation

Integration Tests:
[ ] GHL Integration
[ ] Cost Tracking
[ ] Template System

Error Handling:
[ ] Network errors
[ ] API errors
[ ] OAuth errors

Performance:
[ ] Load testing
[ ] Memory usage
[ ] Response times

Security:
[ ] Webhook security
[ ] OAuth security
[ ] Data validation

UX Testing:
[ ] Navigation
[ ] Forms
[ ] Modals
[ ] Responsive design

Browser Compatibility:
[ ] Chrome
[ ] Firefox
[ ] Safari
[ ] Edge
[ ] Mobile browsers

Issues Found:
1. ___________
2. ___________
3. ___________

Overall Status: [ ] PASS [ ] FAIL [ ] PARTIAL
```

---

## 🚀 Quick Test Commands

```bash
# Start backend
cd server && npm run dev

# Start frontend
npm run dev

# Test API health
curl http://localhost:10000/health

# Test template loading
curl http://localhost:10000/api/templates

# Test agent generation
curl -X POST http://localhost:10000/api/voice-ai/generate \
  -H "Content-Type: application/json" \
  -d '{"businessDescription":"Test business","industry":"fitness"}'
```

---

**Last Updated:** 2025-01-28  
**Status:** Ready for Testing ✅
