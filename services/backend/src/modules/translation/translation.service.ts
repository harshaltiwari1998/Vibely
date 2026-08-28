import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const logger = new Logger("TranslationService");

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface DetectionResponse {
  language: string;
  confidence: number;
}

@Injectable()
export class TranslationService {
  private readonly defaultSourceLanguage: string;
  private readonly supportedLanguages: string[];

  constructor(private readonly configService: ConfigService) {
    this.defaultSourceLanguage = this.configService.get<string>("translation.defaultSource", "en");
    this.supportedLanguages = this.configService.get<string[]>("translation.supported", ["en", "hi"]);
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResponse> {
    const source = sourceLanguage || this.defaultSourceLanguage;
    if (source === targetLanguage) {
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: source,
        targetLanguage,
      };
    }

    if (!this.isLanguageSupported(targetLanguage)) {
      throw new BadRequestException(`Unsupported target language: ${targetLanguage}`);
    }

    logger.debug("Translation requested", { textLength: text.length, source, target: targetLanguage });

    // In a real implementation, call an external translation service (e.g., Google Cloud Translation, DeepL, etc.)
    // Do not hardcode API keys - load from configuration
    // Example:
    // const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     q: text,
    //     source: source,
    //     target: targetLanguage,
    //     format: 'text',
    //   }),
    // });
    // const data = await response.json();

    // Placeholder response for architecture validation
    return {
      originalText: text,
      translatedText: `[${targetLanguage}] ${text}`,
      sourceLanguage: source,
      targetLanguage,
    };
  }

  async detectLanguage(text: string): Promise<DetectionResponse> {
    if (!text || text.trim().length === 0) {
      return {
        language: this.defaultSourceLanguage,
        confidence: 1.0,
      };
    }

    logger.debug("Language detection requested", { textLength: text.length });

    // In a real implementation, call an external language detection service
    // Example:
    // const response = await fetch('https://translation.googleapis.com/language/translate/v2/detect', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     q: text,
    //   }),
    // });
    // const data = await response.json();
    // const detection = data.data.detections[0][0];

    // Placeholder response for architecture validation
    return {
      language: this.defaultSourceLanguage,
      confidence: 0.9,
    };
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.includes(languageCode.toLowerCase());
  }
}
