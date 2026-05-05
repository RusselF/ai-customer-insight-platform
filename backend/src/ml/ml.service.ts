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

  async analyzeSentiment(text: string) {
    const mlApiUrl = this.configService.get<string>('ML_API_URL');
    
    if (!mlApiUrl) {
      throw new InternalServerErrorException('ML_API_URL is not configured in .env');
    }

    const endpoint = `${mlApiUrl}/predict/sentiment`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, { text }).pipe(
          catchError((error) => {
            this.logger.error('Error calling ML Service:', error?.response?.data || error.message);
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
