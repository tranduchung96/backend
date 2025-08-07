import { UseCaseValidatableAdapter } from '@core/common/adapter/usecase/UseCaseValidatableAdapter';
import { AddPostMediaPort, RemovePostMediaPort, ReorderPostMediaPort } from '@core/domain/post/port/usecase/ManagePostMediaPort';
import { Exclude, Expose, plainToClass, Type } from 'class-transformer';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

@Exclude()
export class AddPostMediaAdapter extends UseCaseValidatableAdapter implements AddPostMediaPort {

    @Expose()
    @IsUUID()
    public executorId: string;

    @Expose()
    @IsUUID()
    public postId: string;

    @Expose()
    @IsUUID()
    public mediaId: string;

    @Expose()
    @IsEnum(['COVER', 'GALLERY'])
    public type: 'COVER' | 'GALLERY';

    @Expose()
    @IsOptional()
    @IsNumber()
    public sortOrder?: number;

    public static async new(payload: AddPostMediaPort): Promise<AddPostMediaAdapter> {
        const adapter: AddPostMediaAdapter = plainToClass(AddPostMediaAdapter, payload);
        await adapter.validate();

        return adapter;
    }
}

@Exclude()
export class RemovePostMediaAdapter extends UseCaseValidatableAdapter implements RemovePostMediaPort {

    @Expose()
    @IsUUID()
    public executorId: string;

    @Expose()
    @IsUUID()
    public postId: string;

    @Expose()
    @IsUUID()
    public mediaId: string;

    public static async new(payload: RemovePostMediaPort): Promise<RemovePostMediaAdapter> {
        const adapter: RemovePostMediaAdapter = plainToClass(RemovePostMediaAdapter, payload);
        await adapter.validate();

        return adapter;
    }
}

class MediaOrderItem {
    @Expose()
    @IsUUID()
    public mediaId: string;

    @Expose()
    @IsNumber()
    public sortOrder: number;
}

@Exclude()
export class ReorderPostMediaAdapter extends UseCaseValidatableAdapter implements ReorderPostMediaPort {

    @Expose()
    @IsUUID()
    public executorId: string;

    @Expose()
    @IsUUID()
    public postId: string;

    @Expose()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaOrderItem)
    public mediaOrders: Array<{
        mediaId: string;
        sortOrder: number;
    }>;

    public static async new(payload: ReorderPostMediaPort): Promise<ReorderPostMediaAdapter> {
        const adapter: ReorderPostMediaAdapter = plainToClass(ReorderPostMediaAdapter, payload);
        await adapter.validate();

        return adapter;
    }
}