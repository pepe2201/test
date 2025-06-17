export interface ContentTags {
  contentType: 'url' | 'code' | 'email' | 'phone' | 'text' | 'json' | 'markdown' | 'sql' | 'command' | 'path';
  tags: string[];
  language?: string;
  confidence: number;
}

export function analyzeContentType(content: string): ContentTags {
  const trimmedContent = content.trim();
  const tags: string[] = [];
  let contentType: ContentTags['contentType'] = 'text';
  let language: string | undefined;
  let confidence = 0.8;

  // URL Detection
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
  const urlMatches = trimmedContent.match(urlRegex);
  if (urlMatches && urlMatches.length > 0) {
    contentType = 'url';
    tags.push('url', 'link');
    confidence = 0.95;
    
    // Detect specific URL types
    const url = urlMatches[0].toLowerCase();
    if (url.includes('github.com')) tags.push('github', 'repository');
    if (url.includes('stackoverflow.com')) tags.push('stackoverflow', 'help');
    if (url.includes('youtube.com') || url.includes('youtu.be')) tags.push('youtube', 'video');
    if (url.includes('docs.') || url.includes('documentation')) tags.push('documentation');
    if (url.includes('api.')) tags.push('api');
    
    return { contentType, tags, confidence };
  }

  // Email Detection
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailRegex.test(trimmedContent)) {
    contentType = 'email';
    tags.push('email', 'contact');
    confidence = 0.95;
    return { contentType, tags, confidence };
  }

  // Phone Number Detection
  const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/;
  if (phoneRegex.test(trimmedContent) && trimmedContent.length < 50) {
    contentType = 'phone';
    tags.push('phone', 'contact');
    confidence = 0.9;
    return { contentType, tags, confidence };
  }

  // JSON Detection
  try {
    JSON.parse(trimmedContent);
    contentType = 'json';
    tags.push('json', 'data', 'structured');
    confidence = 0.95;
    return { contentType, tags, confidence };
  } catch {
    // Not JSON, continue checking
  }

  // Code Detection Patterns
  const codePatterns = [
    // JavaScript/TypeScript
    { regex: /(function\s+\w+|const\s+\w+\s*=|=>|import\s+.*from|export\s+)/i, language: 'javascript', tags: ['javascript', 'code'] },
    { regex: /(interface\s+\w+|type\s+\w+\s*=|as\s+\w+)/i, language: 'typescript', tags: ['typescript', 'code'] },
    
    // Python
    { regex: /(def\s+\w+|import\s+\w+|from\s+\w+\s+import|if\s+__name__|print\()/i, language: 'python', tags: ['python', 'code'] },
    
    // Java/C#
    { regex: /(public\s+class|private\s+\w+|System\.out\.println|Console\.WriteLine)/i, language: 'java', tags: ['java', 'code'] },
    
    // SQL
    { regex: /(SELECT\s+.*FROM|INSERT\s+INTO|UPDATE\s+.*SET|DELETE\s+FROM|CREATE\s+TABLE)/i, language: 'sql', tags: ['sql', 'database', 'query'] },
    
    // HTML/CSS
    { regex: /(<\/?\w+[^>]*>|@media|\.[\w-]+\s*{)/i, language: 'html', tags: ['html', 'css', 'web'] },
    
    // Shell/Bash
    { regex: /(sudo\s+|npm\s+|git\s+|cd\s+|ls\s+|mkdir\s+|bash)/i, language: 'bash', tags: ['bash', 'shell', 'command'] },
    
    // Docker
    { regex: /(FROM\s+\w+|RUN\s+|COPY\s+|WORKDIR\s+)/i, language: 'dockerfile', tags: ['docker', 'container'] },
    
    // Markdown
    { regex: /(^#{1,6}\s+|^\*\s+|\[.*\]\(.*\)|```)/m, language: 'markdown', tags: ['markdown', 'documentation'] },
  ];

  for (const pattern of codePatterns) {
    if (pattern.regex.test(trimmedContent)) {
      contentType = 'code';
      language = pattern.language;
      tags.push(...pattern.tags);
      confidence = 0.9;
      
      // Special handling for SQL
      if (pattern.language === 'sql') {
        contentType = 'sql';
      }
      
      // Special handling for commands
      if (pattern.language === 'bash') {
        contentType = 'command';
      }
      
      return { contentType, tags, language, confidence };
    }
  }

  // File Path Detection
  const pathRegex = /([A-Za-z]:)?[\/\\][\w\s\/\\.-]+|[\w.-]+\/[\w\s\/.-]+/;
  if (pathRegex.test(trimmedContent) && trimmedContent.length < 200) {
    contentType = 'path';
    tags.push('path', 'file');
    confidence = 0.8;
    
    // Detect file extensions
    const extensionMatch = trimmedContent.match(/\.(\w+)$/);
    if (extensionMatch) {
      const ext = extensionMatch[1].toLowerCase();
      tags.push(`${ext}-file`);
      
      // Group by file type
      if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) tags.push('javascript');
      if (['py', 'ipynb'].includes(ext)) tags.push('python');
      if (['html', 'css', 'scss'].includes(ext)) tags.push('web');
      if (['jpg', 'png', 'gif', 'svg'].includes(ext)) tags.push('image');
      if (['mp4', 'mov', 'avi'].includes(ext)) tags.push('video');
      if (['pdf', 'doc', 'docx'].includes(ext)) tags.push('document');
    }
    
    return { contentType, tags, confidence };
  }

  // Advanced Code Pattern Detection (multi-line)
  const lines = trimmedContent.split('\n');
  if (lines.length > 1) {
    const codeIndicators = [
      /^\s*\/\//, // Comments
      /^\s*\/\*/, // Block comments
      /^\s*#/, // Python/shell comments
      /^\s*<!--/, // HTML comments
      /{\s*$/, // Opening braces
      /;\s*$/, // Semicolons
      /^\s*(public|private|protected|static|const|let|var|function|class|interface|type)\s+/,
    ];
    
    let codeLineCount = 0;
    for (const line of lines) {
      if (codeIndicators.some(regex => regex.test(line))) {
        codeLineCount++;
      }
    }
    
    if (codeLineCount / lines.length > 0.3) {
      contentType = 'code';
      tags.push('code', 'multi-line');
      confidence = 0.85;
      return { contentType, tags, confidence };
    }
  }

  // Text Analysis for Categories
  const lowerContent = trimmedContent.toLowerCase();
  
  // Technical content indicators
  if (lowerContent.includes('api') || lowerContent.includes('endpoint')) {
    tags.push('api', 'technical');
  }
  if (lowerContent.includes('error') || lowerContent.includes('exception')) {
    tags.push('error', 'debugging');
  }
  if (lowerContent.includes('config') || lowerContent.includes('setting')) {
    tags.push('configuration');
  }
  if (lowerContent.includes('todo') || lowerContent.includes('fixme')) {
    tags.push('todo', 'task');
  }
  
  // Meeting/Note indicators
  if (lowerContent.includes('meeting') || lowerContent.includes('agenda')) {
    tags.push('meeting', 'notes');
  }
  if (lowerContent.includes('password') || lowerContent.includes('secret')) {
    tags.push('credentials', 'sensitive');
  }
  
  // Length-based tagging
  if (trimmedContent.length > 500) {
    tags.push('long-form');
  } else if (trimmedContent.length < 50) {
    tags.push('short');
  }
  
  // Word count
  const wordCount = trimmedContent.split(/\s+/).length;
  if (wordCount > 100) {
    tags.push('article', 'detailed');
  }

  return { contentType, tags, confidence };
}

export function generateSmartTitle(content: string, analysis: ContentTags): string {
  const trimmedContent = content.trim();
  
  switch (analysis.contentType) {
    case 'url':
      try {
        const url = new URL(trimmedContent);
        return `Link: ${url.hostname}`;
      } catch {
        return `Link: ${trimmedContent.slice(0, 50)}...`;
      }
    
    case 'code':
      const firstLine = trimmedContent.split('\n')[0].trim();
      if (analysis.language) {
        return `${analysis.language.toUpperCase()}: ${firstLine.slice(0, 40)}...`;
      }
      return `Code: ${firstLine.slice(0, 40)}...`;
    
    case 'email':
      const emailMatch = trimmedContent.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      return `Email: ${emailMatch?.[0] || 'Contact'}`;
    
    case 'phone':
      return `Phone: ${trimmedContent.slice(0, 20)}`;
    
    case 'json':
      try {
        const parsed = JSON.parse(trimmedContent);
        const keys = Object.keys(parsed);
        return `JSON: ${keys.slice(0, 3).join(', ')}`;
      } catch {
        return 'JSON Data';
      }
    
    case 'sql':
      const sqlType = trimmedContent.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE)/i)?.[0]?.toUpperCase();
      return `SQL ${sqlType || 'Query'}`;
    
    case 'command':
      const command = trimmedContent.split(' ')[0];
      return `Command: ${command}`;
    
    case 'path':
      const pathParts = trimmedContent.split(/[\/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      return `Path: ${fileName || 'File'}`;
    
    default:
      // For regular text, try to extract a meaningful title
      const sentences = trimmedContent.split(/[.!?]+/);
      const firstSentence = sentences[0].trim();
      
      if (firstSentence.length > 5 && firstSentence.length < 60) {
        return firstSentence;
      }
      
      const words = trimmedContent.split(/\s+/).slice(0, 8).join(' ');
      return words.length > 50 ? `${words.slice(0, 47)}...` : words;
  }
}