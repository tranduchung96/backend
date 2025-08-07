import { MediaType } from '@core/common/enums/MediaEnums';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum PostMediaType {
    COVER = 'COVER',
    GALLERY = 'GALLERY'
}

@Entity('post_media')
export class TypeOrmPostMedia {

    @PrimaryColumn()
    public id: string;

    @Column()
    public postId: string;

    @Column()
    public mediaId: string;

    @Column({
        type: 'enum',
        enum: PostMediaType,
        default: PostMediaType.GALLERY
    })
    public type: PostMediaType;

    @Column({ default: 0 })
    public sortOrder: number;

    @Column()
    public createdAt: Date;

    // Relations data
    public media?: {
        id: string;
        name: string;
        type: MediaType;
        relativePath: string;
        size: number;
        ext: string;
        mimetype: string;
    };

}