import JSZip from 'jszip';

/**
 * Copy text to clipboard with fallback
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // Modern clipboard API
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Copied to clipboard!' };
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        return { success: true, message: 'Copied to clipboard!' };
      } else {
        throw new Error('Copy command failed');
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return { success: false, message: 'Failed to copy to clipboard' };
  }
};

/**
 * Generate a complete React component file with proper imports and exports
 */
export const generateComponentFile = (componentName, jsxCode, cssCode = '') => {
  // Clean component name (remove spaces, special chars)
  const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || 'Component';
  
  // Wrap JSX code in proper React component structure
  const componentCode = `import React from 'react';
${cssCode ? `import './${capitalizedName}.css';` : ''}

const ${capitalizedName} = () => {
  return (
    ${jsxCode}
  );
};

export default ${capitalizedName};
`;

  return {
    componentName: capitalizedName,
    componentCode,
    cssCode
  };
};

/**
 * Generate package.json for the exported component
 */
export const generatePackageJson = (componentName, dependencies = []) => {
  const cleanName = componentName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  
  const defaultDependencies = {
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  };

  // Add custom dependencies if provided
  dependencies.forEach(dep => {
    if (typeof dep === 'string') {
      defaultDependencies[dep] = 'latest';
    } else if (dep.name && dep.version) {
      defaultDependencies[dep.name] = dep.version;
    }
  });

  const packageJson = {
    name: cleanName,
    version: '1.0.0',
    description: `Generated React component: ${componentName}`,
    main: 'index.js',
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject'
    },
    dependencies: defaultDependencies,
    devDependencies: {
      'react-scripts': '5.0.1'
    },
    browserslist: {
      production: [
        '>0.2%',
        'not dead',
        'not op_mini all'
      ],
      development: [
        'last 1 chrome version',
        'last 1 firefox version',
        'last 1 safari version'
      ]
    }
  };

  return JSON.stringify(packageJson, null, 2);
};

/**
 * Generate README.md for the exported component
 */
export const generateReadme = (componentName, description = '') => {
  const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
  
  return `# ${cleanName}

${description || `A React component generated with AI assistance.`}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`jsx
import ${cleanName} from './${cleanName}';

function App() {
  return (
    <div>
      <${cleanName} />
    </div>
  );
}
\`\`\`

## Development

\`\`\`bash
npm start
\`\`\`

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Build

\`\`\`bash
npm run build
\`\`\`

Builds the app for production to the \`build\` folder.

---

*Generated with Component Generator Platform*
`;
};

/**
 * Create a ZIP file with all component files
 */
export const createComponentZip = async (componentName, jsxCode, cssCode = '', dependencies = [], description = '') => {
  try {
    const zip = new JSZip();
    const { componentName: cleanName, componentCode } = generateComponentFile(componentName, jsxCode, cssCode);
    
    // Create component files
    zip.file(`src/${cleanName}.jsx`, componentCode);
    
    if (cssCode) {
      zip.file(`src/${cleanName}.css`, cssCode);
    }
    
    // Create index.js entry point
    const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import ${cleanName} from './src/${cleanName}';
import './src/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <${cleanName} />
  </React.StrictMode>
);
`;
    zip.file('src/index.js', indexJs);
    
    // Create basic index.css
    const indexCss = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
`;
    zip.file('src/index.css', indexCss);
    
    // Create public/index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="${description || `${cleanName} - Generated React Component`}" />
    <title>${cleanName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
`;
    zip.file('public/index.html', indexHtml);
    
    // Create package.json
    zip.file('package.json', generatePackageJson(cleanName, dependencies));
    
    // Create README.md
    zip.file('README.md', generateReadme(cleanName, description));
    
    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
    zip.file('.gitignore', gitignore);
    
    // Generate ZIP file
    const content = await zip.generateAsync({ type: 'blob' });
    return { success: true, content, filename: `${cleanName}-component.zip` };
    
  } catch (error) {
    console.error('Failed to create ZIP file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Trigger download of a blob file
 */
export const downloadBlob = (blob, filename) => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return { success: true, message: 'Download started!' };
  } catch (error) {
    console.error('Failed to download file:', error);
    return { success: false, message: 'Failed to download file' };
  }
};

/**
 * Extract dependencies from JSX code (basic detection)
 */
export const extractDependencies = (jsxCode, cssCode = '') => {
  const dependencies = [];
  
  // Common React UI library patterns
  const libraryPatterns = {
    'react-icons': /import.*from ['"]react-icons/,
    'styled-components': /styled\.|css`/,
    'framer-motion': /import.*motion|import.*from ['"]framer-motion/,
    'react-router-dom': /import.*from ['"]react-router-dom/,
    'axios': /import.*axios|axios\./,
    'lodash': /import.*lodash|_\./,
    'moment': /import.*moment|moment\(/,
    'date-fns': /import.*from ['"]date-fns/,
    'react-hook-form': /import.*from ['"]react-hook-form/,
    'formik': /import.*from ['"]formik/,
    'yup': /import.*from ['"]yup/,
    'react-query': /import.*from ['"]react-query/,
    'swr': /import.*from ['"]swr/
  };
  
  const code = jsxCode + cssCode;
  
  Object.entries(libraryPatterns).forEach(([lib, pattern]) => {
    if (pattern.test(code)) {
      dependencies.push(lib);
    }
  });
  
  return dependencies;
};
