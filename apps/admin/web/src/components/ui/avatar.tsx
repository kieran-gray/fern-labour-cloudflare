import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex size-10 shrink-0 overflow-hidden border-2 border-cp-black bg-cp-beige",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square size-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "relative flex size-full items-center justify-center bg-cp-beige font-mono font-bold text-cp-black text-xs overflow-hidden",
      className,
    )}
    {...props}
  >
    {/* Scanline effect */}
    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.05)_2px,rgba(0,0,0,0.05)_4px)] pointer-events-none z-0" />

    {/* Content */}
    <div className="relative z-10 tracking-tighter">{props.children}</div>

    {/* Corner brackets - using standard ASCII */}
    <div className="absolute top-0 left-0 text-cp-orange text-[6px] leading-none z-20 font-bold">
      +
    </div>
    <div className="absolute top-0 right-0 text-cp-orange text-[6px] leading-none z-20 font-bold">
      +
    </div>
    <div className="absolute bottom-0 left-0 text-cp-orange text-[6px] leading-none z-20 font-bold">
      +
    </div>
    <div className="absolute bottom-0 right-0 text-cp-orange text-[6px] leading-none z-20 font-bold">
      +
    </div>
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };
