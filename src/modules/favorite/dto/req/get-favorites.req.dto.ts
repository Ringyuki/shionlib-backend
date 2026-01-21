import { IsOptional, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class GetFavoritesReqDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  game_id?: number
}
