import { Inbox } from "lucide-react";
import { ContactMessageCard } from "./ContactMessageCard";
import type { ContactMessage } from "./ContactMessage";

interface ContactMessageListProps {
  messages: ContactMessage[];
  isLoading: boolean;
  error: string | null;
}

export function ContactMessageList({
  messages,
  isLoading,
  error,
}: ContactMessageListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin border-4 border-cp-black border-t-cp-orange"></div>
          <p className="text-sm text-cp-charcoal font-mono uppercase tracking-wider">
            LOADING_MESSAGES...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-cp-black bg-cp-paper p-6 shadow-hard">
        <p className="text-sm text-cp-charcoal font-mono">
          <strong>[ERROR]</strong> {error}
        </p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="border-2 border-dashed border-cp-black bg-cp-paper p-12 text-center shadow-hard">
        <Inbox className="mx-auto mb-4 size-12 text-cp-gray" />
        <h3 className="font-mono font-bold mb-2 text-lg text-cp-black uppercase tracking-wider">
          NO_MESSAGES_YET
        </h3>
        <p className="text-sm text-cp-gray font-mono">
          &gt; Contact form submissions will appear here.
        </p>
      </div>
    );
  }

  const sortedMessages = messages.sort((a, b) =>
    b.received_at.localeCompare(a.received_at),
  );

  return (
    <div className="space-y-4">
      {sortedMessages.map((message) => (
        <ContactMessageCard key={message.id} message={message} />
      ))}
    </div>
  );
}
