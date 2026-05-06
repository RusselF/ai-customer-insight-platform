import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getMlApiUrl(): string {
    const url = this.configService.get<string>('ML_API_URL');
    if (!url) {
      throw new InternalServerErrorException('ML_API_URL is not configured in .env');
    }
    return url;
  }

  async analyzeKeyword(keyword: string) {
    const endpoint = `${this.getMlApiUrl()}/analyze/keyword`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { keyword }).pipe(
          catchError((error) => {
            this.logger.error('Error calling ML Service (keyword):', error?.response?.data || error.message);
            throw new InternalServerErrorException('Failed to communicate with ML Service');
          }),
        ),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Legacy method kept for compatibility
  async analyzeSentiment(text: string) {
    const endpoint = `${this.getMlApiUrl()}/predict/sentiment`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { text }).pipe(
          catchError(() => {
             // If sentiment endpoint is removed, redirect to a simple keyword mock logic or error
             throw new InternalServerErrorException('Please use keyword analysis endpoint');
          }),
        ),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
