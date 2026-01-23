use std::rc::Rc;

use fern_labour_event_sourcing_rs::EventStoreTrait;
use tracing::warn;
use worker::State;

pub struct WebSocketEventBroadcaster {
    event_store: Rc<dyn EventStoreTrait>,
    default_batch_size: i64,
}

impl WebSocketEventBroadcaster {
    pub fn create(event_store: Rc<dyn EventStoreTrait>, default_batch_size: i64) -> Self {
        Self {
            event_store,
            default_batch_size,
        }
    }

    pub fn broadcast_new_events(&self, state: &State, since_sequence: i64) -> anyhow::Result<()> {
        // TODO: not all websocket clients need or should receive all domain events.
        // They should be filtered by permissions and even potentially have info redacted.

        let new_events = self
            .event_store
            .events_since(since_sequence, self.default_batch_size)?;

        if new_events.is_empty() {
            return Ok(());
        }

        let websockets = state.get_websockets();

        for ws in websockets {
            for event in &new_events {
                if let Err(e) = ws.send(&event.event_data) {
                    warn!(error = ?e, "Failed to send event to WebSocket client");
                }
            }
        }

        Ok(())
    }
}
