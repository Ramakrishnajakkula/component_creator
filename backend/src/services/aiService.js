const axios = require('axios');
const config = require('../config/env');

class AIService {
  constructor() {
    this.apiKey = config.ai.apiKey;
    this.baseUrl = config.ai.baseUrl;
    this.defaultModel = config.ai.model;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Component Generator Platform'
      },
      timeout: 30000 // 30 seconds
    });
  }

  // System prompt for component generation
  getSystemPrompt() {
    return `You are an expert React component generator. Your task is to create clean, modern, and functional React components based on user requirements.

IMPORTANT RULES:
1. Generate ONLY the JSX code and CSS code
2. Use functional components with hooks
3. Return response in this EXACT JSON format:
{
  "jsx": "component code here",
  "css": "css styles here", 
  "dependencies": ["array of npm packages needed"],
  "explanation": "brief explanation of the component"
}

4. JSX Requirements:
   - Use modern React patterns (hooks, functional components)
   - Include proper component structure with export default
   - Use semantic HTML elements
   - Add proper className attributes that match CSS
   - Include interactive elements where appropriate
   - No TypeScript - use plain JavaScript
   - DO NOT include any import statements (React is globally available)
   - DO NOT include "import React from 'react'" or any other imports
   - Use defensive programming: check arrays with .length before accessing
   - Initialize state with proper default values
   - Use optional chaining (?.) when accessing object properties
   - Add null/undefined checks for dynamic data

5. CSS Requirements:
   - Use modern CSS features (flexbox, grid, custom properties)
   - Make components responsive
   - Include hover states and transitions
   - Use meaningful class names
   - Follow BEM naming convention when appropriate

6. Dependencies:
   - Only include necessary npm packages
   - Prefer standard React features over external libraries
   - Common packages like 'react-icons' are acceptable

7. Make components visually appealing with:
   - Proper spacing and layout
   - Nice color schemes
   - Smooth transitions
   - Responsive design
   - Accessibility considerations

8. When analyzing provided images:
   - Pay close attention to layout, colors, typography, and spacing
   - Identify UI components (buttons, forms, cards, etc.)
   - Match the visual design as closely as possible
   - Include responsive design principles
   - Implement interactive elements shown in the design
   - Use appropriate CSS for styling to match the image
   - If the image shows a mockup or design, recreate it accurately

Example response:
{
  "jsx": "const Button = () => {\\n  const [clicked, setClicked] = useState(false);\\n  const [count, setCount] = useState(0);\\n  \\n  const handleClick = () => {\\n    setClicked(!clicked);\\n    setCount(prev => prev + 1);\\n  };\\n  \\n  return (\\n    <button className=\\"btn\\" onClick={handleClick}>\\n      {clicked ? \`Clicked \${count} times!\` : 'Click Me'}\\n    </button>\\n  );\\n};\\n\\nexport default Button;",
  "css": ".btn { padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 16px; } .btn:hover { background: #0056b3; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,123,255,0.3); }",
  "dependencies": [],
  "explanation": "An interactive button component with click counter and smooth hover animations"
}`;
  }

  // Generate component based on user prompt
  async generateComponent(prompt, model = this.defaultModel, images = []) {
    try {
      // Prepare the user message
      let userMessage = {
        role: 'user',
        content: `Create a React component: ${prompt}`
      };

      // If images are provided, format them for the vision model
      if (images && images.length > 0) {
        console.log('🖼️ Processing', images.length, 'images for AI model');
        
        // For vision models, we need to format the content as an array
        const content = [
          {
            type: 'text',
            text: `Create a React component: ${prompt}`
          }
        ];

        // Add each image to the content
        images.forEach((image, index) => {
          if (image.data && image.type) {
            content.push({
              type: 'image_url',
              image_url: {
                url: `data:${image.type};base64,${image.data}`,
                detail: 'high' // Use high detail for better analysis
              }
            });
            console.log(`📸 Added image ${index + 1}: ${image.name} (${image.type})`);
          }
        });

        userMessage.content = content;
      }

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          userMessage
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = response.data.choices[0].message.content;

      // Try to parse JSON response
      try {
        const componentData = JSON.parse(aiResponse);
        return {
          success: true,
          data: componentData,
          metadata: {
            model: model,
            tokens: response.data.usage.total_tokens,
            processingTime: Date.now()
          }
        };
      } catch (parseError) {
        // If JSON parsing fails, try to extract code blocks
        return this.extractCodeFromResponse(aiResponse, model, response.data.usage.total_tokens);
      }
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error(this.handleAIError(error));
    }
  }

  // Refine existing component
  async refineComponent(prompt, currentCode, model = this.defaultModel) {
    try {
      const refinementPrompt = `
Current component code:
JSX: ${currentCode.jsx}
CSS: ${currentCode.css}

Please modify this component based on this request: ${prompt}

Return the updated component in the same JSON format with jsx, css, dependencies, and explanation fields.
`;

      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: refinementPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = response.data.choices[0].message.content;

      try {
        const componentData = JSON.parse(aiResponse);
        return {
          success: true,
          data: componentData,
          metadata: {
            model: model,
            tokens: response.data.usage.total_tokens,
            processingTime: Date.now(),
            isRefinement: true
          }
        };
      } catch (parseError) {
        return this.extractCodeFromResponse(aiResponse, model, response.data.usage.total_tokens, true);
      }
    } catch (error) {
      console.error('AI Refinement Error:', error);
      throw new Error(this.handleAIError(error));
    }
  }

  // Extract code from non-JSON responses
  extractCodeFromResponse(response, model, tokens, isRefinement = false) {
    const jsxMatch = response.match(/```(?:jsx|javascript|js)?\n?([\s\S]*?)\n?```/);
    const cssMatch = response.match(/```css\n?([\s\S]*?)\n?```/);

    let jsx = '';
    let css = '';

    if (jsxMatch) {
      jsx = jsxMatch[1].trim();
    } else {
      // Try to find JSX in the response without code blocks
      jsx = response.trim();
    }

    if (cssMatch) {
      css = cssMatch[1].trim();
    }

    return {
      success: true,
      data: {
        jsx: jsx,
        css: css,
        dependencies: [],
        explanation: isRefinement ? 'Component refined based on your request' : 'Component generated from your prompt'
      },
      metadata: {
        model: model,
        tokens: tokens,
        processingTime: Date.now(),
        extractedFromText: true,
        isRefinement
      }
    };
  }

  // Handle different types of AI API errors
  handleAIError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return 'Invalid request to AI service. Please check your prompt.';
        case 401:
          return 'AI service authentication failed. Please check API configuration.';
        case 403:
          return 'AI service access forbidden. Please check your API permissions.';
        case 429:
          return 'AI service rate limit exceeded. Please try again later.';
        case 500:
          return 'AI service is temporarily unavailable. Please try again.';
        default:
          return data?.error?.message || 'AI service error occurred.';
      }
    } else if (error.request) {
      return 'Unable to connect to AI service. Please check your internet connection.';
    } else {
      return error.message || 'Unknown AI service error occurred.';
    }
  }

  // Get available models
  async getAvailableModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data.filter(model =>
        model.id.includes('gpt') ||
        model.id.includes('llama') ||
        model.id.includes('claude') ||
        model.id.includes('gemini')
      );
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  // Chat completion for general queries (non-component generation)
  async chatCompletion(messages, model = this.defaultModel) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      return {
        success: true,
        message: response.data.choices[0].message.content,
        metadata: {
          model: model,
          tokens: response.data.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Chat Completion Error:', error);
      throw new Error(this.handleAIError(error));
    }
  }
}

module.exports = new AIService();
