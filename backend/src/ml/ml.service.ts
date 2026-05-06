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

  async analyzeSentiment(text: string) {
    const endpoint = `${this.getMlApiUrl()}/predict/sentiment`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { text }).pipe(
          catchError((error) => {
            this.logger.error('Error calling ML Service (sentiment):', error?.response?.data || error.message);
            throw new InternalServerErrorException('Failed to communicate with ML Service');
          }),
        ),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async analyzeAll(text: string) {
    const endpoint = `${this.getMlApiUrl()}/analyze-all`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { text }).pipe(
          catchError((error) => {
            this.logger.error('Error calling ML Service (analyze-all):', error?.response?.data || error.message);
            throw new InternalServerErrorException('Failed to communicate with ML Service');
          }),
        ),
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}
