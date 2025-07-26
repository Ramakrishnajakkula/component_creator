// Message processing utilities
export const detectComponentRequest = (message) => {
  const componentKeywords = [
    'create', 'build', 'make', 'generate', 'design',
    'component', 'button', 'form', 'card', 'modal', 'navbar', 'header', 'footer',
    'sidebar', 'menu', 'dropdown', 'tooltip', 'table', 'list', 'grid',
    'hero', 'banner', 'pricing', 'contact', 'login', 'register'
  ];

  const lowerMessage = message.toLowerCase();
  return componentKeywords.some(keyword => lowerMessage.includes(keyword));
};

export const extractComponentType = (message) => {
  const componentTypes = {
    'button': ['button', 'btn', 'cta'],
    'form': ['form', 'input', 'contact form', 'login form', 'register'],
    'card': ['card', 'product card', 'profile card'],
    'modal': ['modal', 'dialog', 'popup'],
    'navigation': ['navbar', 'nav', 'navigation', 'menu'],
    'hero': ['hero', 'banner', 'landing'],
    'table': ['table', 'data table', 'list'],
    'layout': ['layout', 'grid', 'container']
  };

  const lowerMessage = message.toLowerCase();
  
  for (const [type, keywords] of Object.entries(componentTypes)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return type;
    }
  }
  
  return 'component';
};

export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const sanitizeMessage = (message) => {
  // Remove dangerous HTML/JS
  return message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};
