import { type Service } from "@/config/commandCenter";

interface ServiceSelectorProps {
  services: Service[];
  onSelectService: (serviceId: string) => void;
}

export function ServiceSelector({
  services,
  onSelectService,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      {services.map((service, index) => {
        return (
          <button
            key={service.id}
            onClick={() => onSelectService(service.id)}
            className="group w-full border-2 border-cp-black bg-cp-paper relative hover:translate-x-1 transition-transform text-left shadow-hard-sm"
          >
            <div
              className={`absolute -left-2 top-4 bg-${service.color} border-2 border-cp-black px-2 py-1 font-mono font-bold text-xs text-cp-paper shadow-hard-sm`}
            >
              {index.toString().padStart(2, "0")}
            </div>

            <div className="absolute left-3 top-8 bottom-0 flex flex-col justify-around py-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 rounded-full border-2 border-cp-black bg-cp-beige"
                />
              ))}
            </div>

            <div className="ml-12 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-mono font-bold uppercase text-sm text-cp-black tracking-wider">
                  {service.name}
                </h3>
                <span className="font-mono text-xs font-bold uppercase text-cp-green shrink-0">
                  ● ONLINE
                </span>
              </div>

              <p className="text-xs font-mono text-cp-charcoal leading-relaxed mb-3">
                {service.description}
              </p>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-cp-gray">
                  COMMANDS:{" "}
                  <strong className="text-cp-black">
                    {service.commands.length}
                  </strong>
                </span>
              </div>
            </div>

            <div className="absolute bottom-0 right-0 w-3 h-3 border-l-2 border-t-2 border-cp-black opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      })}
    </div>
  );
}
