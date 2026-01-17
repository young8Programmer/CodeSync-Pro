import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface Judge0Submission {
  language_id: number;
  source_code: string;
  stdin?: string;
}

interface Judge0Response {
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  message?: string;
  status: {
    id: number;
    description: string;
  };
}

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  php: 68,
  ruby: 72,
  go: 60,
  rust: 73,
  kotlin: 78,
  swift: 83,
  typescript: 74,
};

@Injectable()
export class CodeService {
  private judge0Client: AxiosInstance;
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get('judge0.apiUrl');
    this.apiKey = this.configService.get('judge0.apiKey');

    this.judge0Client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
    });
  }

  async executeCode(
    code: string,
    language: string,
    stdin?: string,
  ): Promise<{
    output: string;
    error: string | null;
    status: string;
  }> {
    const languageId = LANGUAGE_IDS[language.toLowerCase()];

    if (!languageId) {
      throw new BadRequestException(
        `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_IDS).join(', ')}`,
      );
    }

    try {
      // Submit code
      const submission: Judge0Submission = {
        language_id: languageId,
        source_code: Buffer.from(code).toString('base64'),
      };

      if (stdin) {
        submission.stdin = Buffer.from(stdin).toString('base64');
      }

      const submitResponse = await this.judge0Client.post(
        '/submissions',
        submission,
        {
          params: {
            base64_encoded: 'true',
            fields: '*',
          },
        },
      );

      const token = submitResponse.data.token;

      // Poll for result
      let result: Judge0Response;
      let attempts = 0;
      const maxAttempts = 30;

      do {
        await this.delay(1000); // Wait 1 second
        const resultResponse = await this.judge0Client.get(
          `/submissions/${token}`,
          {
            params: {
              base64_encoded: 'true',
              fields: '*',
            },
          },
        );

        result = resultResponse.data;
        attempts++;
      } while (
        result.status.id <= 2 && // Status 1: In Queue, 2: Processing
        attempts < maxAttempts
      );

      // Decode base64 responses
      const output = result.stdout
        ? Buffer.from(result.stdout, 'base64').toString()
        : '';
      const error = result.stderr
        ? Buffer.from(result.stderr, 'base64').toString()
        : result.compile_output
          ? Buffer.from(result.compile_output, 'base64').toString()
          : null;

      return {
        output: output || result.message || '',
        error,
        status: result.status.description,
      };
    } catch (error) {
      throw new BadRequestException(
        `Code execution failed: ${error.message}`,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getSupportedLanguages(): string[] {
    return Object.keys(LANGUAGE_IDS);
  }
}
