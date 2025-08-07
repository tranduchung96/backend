// src/infrastructure/adapter/persistence/typeorm/migration/1594770165390-CreatePostMediaTable.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePostMediaTable1594770165390 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TYPE POST_MEDIA_TYPE_ENUM as ENUM ('COVER', 'GALLERY');
    `);

        await queryRunner.query(`
      CREATE TABLE public."post_media"(
        "id"          UUID PRIMARY KEY DEFAULT uuid_generate_v1mc(),
        "postId"      UUID NOT NULL,
        "mediaId"     UUID NOT NULL,
        "type"        POST_MEDIA_TYPE_ENUM NOT NULL DEFAULT 'GALLERY',
        "sortOrder"   INTEGER NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        
        CONSTRAINT "FK_post_media_post" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_post_media_media" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_post_media_post_media" UNIQUE ("postId", "mediaId"),
        CONSTRAINT "UQ_post_cover" UNIQUE ("postId", "type") DEFERRABLE INITIALLY DEFERRED
      );
    `);

        // Create indexes for better performance
        await queryRunner.query(`
      CREATE INDEX "IDX_post_media_post_id" ON "post_media" ("postId");
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_post_media_media_id" ON "post_media" ("mediaId");
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_post_media_type" ON "post_media" ("type");
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_post_media_sort_order" ON "post_media" ("postId", "sortOrder");
    `);

        // Migrate existing post images to post_media table
        await queryRunner.query(`
      INSERT INTO "post_media" ("postId", "mediaId", "type", "sortOrder", "createdAt")
      SELECT 
        "id" as "postId",
        "imageId" as "mediaId",
        'COVER' as "type",
        0 as "sortOrder",
        "createdAt"
      FROM "post" 
      WHERE "imageId" IS NOT NULL;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "IDX_post_media_sort_order";');
        await queryRunner.query('DROP INDEX "IDX_post_media_type";');
        await queryRunner.query('DROP INDEX "IDX_post_media_media_id";');
        await queryRunner.query('DROP INDEX "IDX_post_media_post_id";');
        await queryRunner.query('DROP TABLE public."post_media";');
        await queryRunner.query('DROP TYPE POST_MEDIA_TYPE_ENUM;');
    }
}