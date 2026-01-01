import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
}

export function ConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  variant = "danger",
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const isDanger = variant === "danger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-4 border-double border-cp-black bg-cp-beige shadow-hard max-w-md p-0 gap-0 rounded-none [&>button]:hidden">
        {/* Header */}
        <div
          className={`relative overflow-hidden border-b-4 border-double border-cp-black p-4 ${
            isDanger ? "bg-red-600" : "bg-cp-orange"
          }`}
        >
          <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.4)_10px,rgba(0,0,0,0.4)_20px)]" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <DialogTitle className="font-mono font-bold text-white uppercase tracking-widest text-lg m-0">
                {isDanger ? "[!]" : "[?]"} {title}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-cp-paper border-b-2 border-cp-black">
          <DialogDescription className="font-mono text-sm text-cp-charcoal leading-relaxed m-0">
            <div className="mb-3 pb-3 border-b-2 border-dashed border-cp-gray">
              <span className="text-xs text-cp-gray uppercase tracking-wider">
                &gt;&gt; {isDanger ? "SYSTEM_WARNING" : "SYSTEM_PROMPT"}
              </span>
            </div>
            <div className="space-y-2">
              <p className="text-cp-black">{description}</p>
              {isDanger && (
                <p className="text-xs text-cp-gray uppercase tracking-wider mt-4 pt-4 border-t border-dashed border-cp-gray">
                  :: THIS ACTION CANNOT BE UNDONE ::
                </p>
              )}
            </div>
          </DialogDescription>
        </div>

        {/* Footer with Buttons */}
        <DialogFooter className="p-4 bg-cp-beige border-0 gap-3 flex-row">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 font-mono font-bold uppercase text-xs border-2 border-cp-black bg-cp-paper text-cp-charcoal shadow-hard-sm hover:bg-cp-beige hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-300"
          >
            <span className="tracking-widest">{cancelText}</span>
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 font-mono font-bold uppercase text-xs border-4 border-double shadow-hard-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-300 relative overflow-hidden group ${
              isDanger
                ? "border-red-900 bg-red-600 text-white hover:bg-red-700 hover:border-cp-black"
                : "border-cp-black bg-cp-orange text-cp-paper hover:bg-[#ff7722] hover:border-cp-black"
            }`}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)]" />
            <span className="relative z-10 tracking-widest">{confirmText}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
