import { Terminal, ArrowRight } from "lucide-react";
import { type Command } from "@/config/commandCenter";

interface CommandSelectorProps {
  commands: Command[];
  onSelectCommand: (commandId: string) => void;
  onBack: () => void;
}

export function CommandSelector({
  commands,
  onSelectCommand,
  onBack,
}: CommandSelectorProps) {
  // Group commands by category
  const groupedCommands = commands.reduce(
    (acc, command) => {
      const category = command.category || "GENERAL";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(command);
      return acc;
    },
    {} as Record<string, Command[]>,
  );

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="group inline-flex items-center gap-2 px-4 py-2 border-2 border-cp-black bg-cp-paper text-cp-charcoal hover:text-cp-black font-mono text-xs uppercase font-bold shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
      >
        <ArrowRight className="size-3 rotate-180" />
        [BACK_TO_SERVICES]
      </button>

      {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
        <div
          key={category}
          className="border-2 border-cp-black bg-cp-paper relative"
        >
          <div className="bg-cp-beige border-b-2 border-cp-black px-4 py-2">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-cp-orange" />
              <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-cp-black">
                # {category}_COMMANDS
              </h3>
            </div>
          </div>

          <div className="divide-y-2 divide-dashed divide-cp-black">
            {categoryCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => onSelectCommand(command.id)}
                className="group w-full text-left px-4 py-3 hover:bg-cp-beige transition-colors relative"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-cp-gray shrink-0 mt-0.5">
                    [{index.toString().padStart(2, "0")}]
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-cp-black">
                        {command.name}
                      </h4>
                      <ArrowRight className="size-4 text-cp-orange opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    </div>

                    <p className="text-xs text-cp-charcoal font-mono leading-relaxed mb-2">
                      {command.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-cp-gray">
                        METHOD:{" "}
                        <strong className="text-cp-black">
                          {command.method}
                        </strong>
                      </span>
                      <span className="text-cp-gray">·</span>
                      <span className="text-cp-gray">
                        PARAMS:{" "}
                        <strong className="text-cp-black">
                          {command.fields.length}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cp-orange opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
