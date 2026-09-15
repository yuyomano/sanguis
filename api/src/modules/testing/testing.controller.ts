import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { TestingService } from './testing.service';
import { CreateTestResultDto } from './dto/create-test-result.dto';
import { SubmitResultsDto } from './dto/submit-results.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Testing de viabilidad: laboratorio (LAB_TECH) y administración.
@ApiTags('testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.LAB_TECH)
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('tests')
  @ApiOperation({ summary: 'Iniciar test para unidad de sangre' })
  createTest(@Body() dto: CreateTestResultDto) {
    return this.testingService.createTest(dto);
  }

  @Get('tests/:id')
  @ApiOperation({ summary: 'Detalle de un test con info de unidad y donante' })
  findTest(@Param('id') id: string) {
    return this.testingService.findTest(id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Tests pendientes de resultado' })
  getPending() {
    return this.testingService.getPendingTests();
  }

  @Patch('tests/:id/results')
  @ApiOperation({ summary: 'Cargar resultados del test (viabilidad automática)' })
  submitResults(@Param('id') id: string, @Body() dto: SubmitResultsDto) {
    return this.testingService.submitResults(id, dto.results, dto.technicianId);
  }

  @Patch('tests/:id/share')
  @ApiOperation({ summary: 'Compartir resultados de salud con el donante' })
  shareWithDonor(@Param('id') id: string) {
    return this.testingService.shareWithDonor(id);
  }

  @Get('donors/:donorId/history')
  @ApiOperation({ summary: 'Historial de tests del donante' })
  getDonorHistory(@Param('donorId') donorId: string) {
    return this.testingService.getDonorTestHistory(donorId);
  }
}
