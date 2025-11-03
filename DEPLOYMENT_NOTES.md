# Deployment Notes for Render

## MCP Server Deployment

The MCP server files are in `server/mcp/` directory. If these files are not present during deployment, the app will still start but MCP endpoints will be disabled.

### Ensuring MCP Files Are Deployed

1. **Check Git Status**: Make sure all MCP files are committed:
   ```bash
   git status
   git add server/mcp/
   git commit -m "Add MCP server files"
   git push
   ```

2. **Verify Files Are Tracked**: Check that `server/mcp/` is not in `.gitignore`:
   ```bash
   git check-ignore -v server/mcp/server.js
   # Should return nothing if file is tracked
   ```

3. **Manual Deployment**: If using Render's manual deploy, ensure:
   - All `server/mcp/*.js` files are included
   - `server/mcp/primitives/` directory is included
   - `server/mcp/monitoring/` directory is included

### If MCP Files Are Missing

The app is now designed to handle missing MCP files gracefully:

- App will start successfully
- MCP endpoints will be disabled
- You'll see a warning: `⚠️  MCP Server not found - MCP endpoints disabled`
- Health check will show `mcpEnabled: false`

To enable MCP later:
1. Ensure files are in `server/mcp/` directory
2. Redeploy

### Build Command for Render

Make sure your build command includes the MCP files. If you have a build step, ensure it doesn't exclude `server/mcp/`:

```bash
# No special build needed - files are JS and should be deployed as-is
```

### Deployment Checklist

- [ ] All MCP files committed to git
- [ ] `server/mcp/server.js` exists
- [ ] `server/mcp/index.js` exists
- [ ] `server/mcp/primitives/` directory exists
- [ ] `server/mcp/monitoring/` directory exists
- [ ] Environment variables set (ELEVENLABS_API_KEY, OPENAI_API_KEY)
- [ ] Database migrations run (includes MCP tables)

### Troubleshooting

**Error: Cannot find module './mcp/server'**
- Check that `server/mcp/server.js` exists in your deployment
- Verify the file path on Render: `/opt/render/project/src/server/mcp/server.js`
- Ensure MCP directory is not being excluded by build process

**MCP endpoints return 404**
- Check logs for "MCP Server routes enabled" message
- Verify `mcpEnabled: true` in `/api/health` response
- Ensure MCP server files are deployed

**MCP works locally but not on Render**
- Check file permissions
- Verify all dependencies are installed (`npm install` in server directory)
- Check that `@modelcontextprotocol/sdk` is in `server/package.json`

