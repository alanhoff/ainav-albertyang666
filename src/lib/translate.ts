/**
 * AI Translation Service using DeepSeek
 */

interface TranslationResult {
  name: string;
  description: string;
  tags: string[];
}

interface MultiLanguageTranslation {
  zh: TranslationResult;
  en: TranslationResult;
  ja: TranslationResult;
  ko: TranslationResult;
  fr: TranslationResult;
}

/**
 * Translate tool content to multiple languages using DeepSeek
 */
export async function translateToolContent({
  name,
  description,
  tags,
}: {
  name: string;
  description: string;
  tags: string[];
}): Promise<MultiLanguageTranslation | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.warn('DEEPSEEK_API_KEY not configured, skipping translation');
    return null;
  }

  try {
    const prompt = `You are a professional translator. Please translate the following AI tool information into Chinese (zh), English (en), Japanese (ja), Korean (ko), and French (fr).

Tool Name: ${name}
Description: ${description}
Tags: ${tags.join(', ')}

IMPORTANT: Respond ONLY with valid JSON in this exact format, no additional text:
{
  "zh": {
    "name": "translated name in Chinese",
    "description": "translated description in Chinese",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "en": {
    "name": "translated name in English",
    "description": "translated description in English",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "ja": {
    "name": "translated name in Japanese",
    "description": "translated description in Japanese",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "ko": {
    "name": "translated name in Korean",
    "description": "translated description in Korean",
    "tags": ["tag1", "tag2", "tag3"]
  },
  "fr": {
    "name": "translated name in French",
    "description": "translated description in French",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

Rules:
1. Keep tool names concise and recognizable
2. Translate descriptions accurately while maintaining the original meaning
3. Translate tags to be searchable in each language
4. For technical terms and brand names, keep them in English when appropriate
5. Ensure natural, fluent translations for each language`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator specializing in AI tool descriptions. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in DeepSeek response');
      return null;
    }

    // Extract JSON from response (in case there's extra text)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      return null;
    }

    const translations = JSON.parse(jsonMatch[0]) as MultiLanguageTranslation;

    // Validate the structure
    const requiredLangs = ['zh', 'en', 'ja', 'ko', 'fr'];
    for (const lang of requiredLangs) {
      if (!translations[lang as keyof MultiLanguageTranslation]) {
        console.error(`Missing translation for language: ${lang}`);
        return null;
      }
    }

    return translations;
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
}

/**
 * Fallback: Create same-content translations for all languages
 */
export function createFallbackTranslations({
  name,
  description,
  tags,
}: {
  name: string;
  description: string;
  tags: string[];
}): MultiLanguageTranslation {
  const baseTranslation = { name, description, tags };
  return {
    zh: baseTranslation,
    en: baseTranslation,
    ja: baseTranslation,
    ko: baseTranslation,
    fr: baseTranslation,
  };
}
