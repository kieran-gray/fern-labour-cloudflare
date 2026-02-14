import DOMPurify from "dompurify";
import { type RenderedContent } from "@/components/notification/NotificationTypes";

interface NotificationContentRendererProps {
    content: RenderedContent;
}

export function NotificationContentRenderer({
    content,
}: NotificationContentRendererProps) {
    if ("Email" in content) {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
                        &gt; SUBJECT
                    </h3>
                    <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2">
                        {content.Email.subject}
                    </p>
                </div>
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
                        &gt; HTML_BODY
                    </h3>
                    <div className="border-2 border-cp-black bg-white p-6">
                        <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(content.Email.html_body),
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    if ("Sms" in content) {
        return (
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
                    &gt; MESSAGE
                </h3>
                <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2 whitespace-pre-wrap">
                    {content.Sms.body}
                </p>
            </div>
        );
    }

    if ("WhatsApp" in content) {
        return (
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-cp-gray mb-2">
                    &gt; MESSAGE
                </h3>
                <p className="text-xs text-cp-charcoal bg-cp-beige border-2 border-cp-black px-3 py-2 whitespace-pre-wrap">
                    {content.WhatsApp.body}
                </p>
            </div>
        );
    }

    return null;
}
