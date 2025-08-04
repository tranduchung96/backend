import { DoesMediaExistQuery } from '@core/common/message/query/queries/media/DoesMediaExistQuery';
import { DoesMediaExistQueryResult } from '@core/common/message/query/queries/media/result/DoesMediaExistQueryResult';
import { QueryHandler } from '@core/common/message/query/QueryHandler';

export type DoesMediaExistQueryHandler = QueryHandler<DoesMediaExistQuery, DoesMediaExistQueryResult>
