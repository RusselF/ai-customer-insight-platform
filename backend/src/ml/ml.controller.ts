import { Body, Controller, Post, BadRequestException } from '@nestjs/common';
import { MlService } from './ml.service';

class KeywordDto {
  keyword: string;
}

@Controller('ml')
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Post('analyze-keyword')
  async analyzeKeyword(@Body() body: KeywordDto) {
    if (!body.keyword || body.keyword.trim() === '') {
      throw new BadRequestException('Keyword cannot be empty');
    }
    return this.mlService.analyzeKeyword(body.keyword.trim());
  }
}
