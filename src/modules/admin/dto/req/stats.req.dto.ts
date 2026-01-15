import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationReqDto } from '../../../../shared/dto/req/pagination.req.dto'

export class StatsTrendReqDto {
  @IsOptional()
  @IsDateString()
  startDate?: string

  @IsOptional()
  @IsDateString()
  endDate?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number = 30
}

export class TopGamesReqDto extends PaginationReqDto {}
