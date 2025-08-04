import { EventHandler } from '@core/common/message/event/EventHandler';
import { MediaRemovedEvent } from '@core/common/message/event/events/media/MediaRemovedEvent';

export type PostImageRemovedEventHandler = EventHandler<MediaRemovedEvent>
