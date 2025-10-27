const fs = require('fs');
const path = require('path');

// List of HTML files to update
const htmlFiles = [
    'schema-registry.html',
    'voice-ai-deployer.html',
    'workflow-integration.html',
    'qa-golden-pack.html',
    'export-center.html',
    'rate-limit-queue.html',
    'compliance-safety.html'
];

// Color replacements
const colorReplacements = [
    // Primary color
    { from: /--primary: #00ffa3;/g, to: '--primary: #5566ff;' },
    { from: /--primary: #00e694;/g, to: '--primary: #5566ff;' },
    { from: /--primary: #00c885;/g, to: '--primary: #5566ff;' },
    
    // Primary foreground
    { from: /--primary-foreground: #0a0a0a;/g, to: '--primary-foreground: #ffffff;' },
    
    // Ring color
    { from: /--ring: #00ffa3;/g, to: '--ring: #5566ff;' },
    { from: /--ring: #00e694;/g, to: '--ring: #5566ff;' },
    
    // Background patterns
    { from: /rgba\(0,255,163,0\.1\)/g, to: 'rgba(85,102,255,0.1)' },
    { from: /rgba\(0,255,163,0\.2\)/g, to: 'rgba(85,102,255,0.2)' },
    { from: /rgba\(0,255,163,0\.3\)/g, to: 'rgba(85,102,255,0.3)' },
    { from: /rgba\(0,255,163,0\.4\)/g, to: 'rgba(85,102,255,0.4)' },
    { from: /rgba\(0,255,163,0\.5\)/g, to: 'rgba(85,102,255,0.5)' },
    
    // Gradient text
    { from: /linear-gradient\(135deg, var\(--primary\), #00d4aa\)/g, to: 'linear-gradient(135deg, var(--primary), #4c5ce6)' },
    { from: /linear-gradient\(135deg, #00ffa3, #00e694, #00c885\)/g, to: 'linear-gradient(135deg, #5566ff, #4c5ce6, #3b4dcc)' },
    
    // Box shadows
    { from: /rgba\(0, 255, 163, 0\.3\)/g, to: 'rgba(85, 102, 255, 0.3)' },
    { from: /rgba\(0, 255, 163, 0\.4\)/g, to: 'rgba(85, 102, 255, 0.4)' },
    { from: /rgba\(0, 255, 163, 0\.5\)/g, to: 'rgba(85, 102, 255, 0.5)' },
    
    // Button colors
    { from: /background-color: #00ffa3;/g, to: 'background-color: #5566ff;' },
    { from: /background-color: #00e694;/g, to: 'background-color: #5566ff;' },
    
    // Text colors
    { from: /color: #00ffa3;/g, to: 'color: #5566ff;' },
    { from: /color: #00e694;/g, to: 'color: #5566ff;' }
];

// Update each HTML file
htmlFiles.forEach(fileName => {
    const filePath = path.join(__dirname, fileName);
    
    if (fs.existsSync(filePath)) {
        console.log(`Updating ${fileName}...`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Apply all color replacements
        colorReplacements.forEach(replacement => {
            content = content.replace(replacement.from, replacement.to);
        });
        
        // Write the updated content back
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`✅ Updated ${fileName}`);
    } else {
        console.log(`❌ File not found: ${fileName}`);
    }
});

console.log('\n🎉 All HTML files updated with blue color scheme!');
