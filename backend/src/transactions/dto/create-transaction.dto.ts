import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  Max,
  IsString,
  IsUUID,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity!: number;

  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  addonIds!: string[];
}

export class CreateTransactionDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items!: CreateTransactionItemDto[];

  @IsIn(['CASH', 'QRIS'])
  paymentMethod!: 'CASH' | 'QRIS';

  @IsString()
  @Matches(/^\d{1,8}(?:\.\d{1,2})?$/)
  paidAmount!: string;
}
