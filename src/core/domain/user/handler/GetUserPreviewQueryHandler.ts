import { GetUserPreviewQuery } from '@core/common/message/query/queries/user/GetUserPreviewQuery';
import { GetUserPreviewQueryResult } from '@core/common/message/query/queries/user/result/GetUserPreviewQueryResult';
import { QueryHandler } from '@core/common/message/query/QueryHandler';
import { Optional } from '@core/common/type/CommonTypes';

export type GetUserPreviewQueryHandler = QueryHandler<GetUserPreviewQuery, Optional<GetUserPreviewQueryResult>>
