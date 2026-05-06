import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { MlService } from './ml.service';

class AnalyzeDto {
  text: string;
}

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('analyze-sentiment')
  async analyzeSentiment(@Body() body: AnalyzeDto) {
    if (!body.text || body.text.trim() === '') {
      throw new BadRequestException('Text cannot be empty');
    }
    return this.mlService.analyzeSentiment(body.text);
  }

  @Post('analyze-all')
  async analyzeAll(@Body() body: AnalyzeDto) {
    if (!body.text || body.text.trim() === '') {
      throw new BadRequestException('Text cannot be empty');
    }
    return this.mlService.analyzeAll(body.text);
  }
}
