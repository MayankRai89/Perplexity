import React from "react";

function renderInlineFormatting(text) {
  if (!text) return "";

  const inlineParts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return inlineParts.map((part, partIdx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={partIdx} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={partIdx}
          className="px-1.5 py-0.5 rounded bg-[#131415] border border-[#2d3131]/60 text-emerald-400 font-mono text-[12.5px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const MarkdownRenderer = ({ text }) => {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[14.5px] font-normal text-slate-300">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const language = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);

          return (
            <div
              key={index}
              className="my-4 rounded-xl border border-[#2d3131] bg-[#131415]/60 overflow-hidden shadow-lg select-text"
            >
              <div className="flex justify-between items-center px-4 py-2 bg-[#131415] border-b border-[#2d3131]/60 text-[10px] font-bold text-slate-500 select-none">
                <span className="uppercase tracking-wider">
                  {language || "code"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(code.trim());
                    alert("Code copied to clipboard!");
                  }}
                  className="hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  📋 Copy code
                </button>
              </div>

              <pre className="p-4 overflow-x-auto text-[13px] font-mono text-[#3ab2bf] leading-normal no-scrollbar select-text bg-[#1c1e1f]/50">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        } else {
          const lines = part.split("\n");
          return (
            <div key={index} className="space-y-2">
              {lines.map((line, lineIdx) => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return null;

                const isBullet =
                  trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ");

                const isNumbered = /^\d+\.\s/.test(trimmedLine);

                let content = trimmedLine;
                if (isBullet) {
                  content = trimmedLine.substring(2);
                } else if (isNumbered) {
                  content = trimmedLine.replace(/^\d+\.\s/, "");
                }

                const parsed = renderInlineFormatting(content);

                if (isBullet) {
                  return (
                    <li
                      key={lineIdx}
                      className="list-disc ml-5 pl-1 text-slate-300"
                    >
                      {parsed}
                    </li>
                  );
                } else if (isNumbered) {
                  return (
                    <li
                      key={lineIdx}
                      className="list-decimal ml-5 pl-1 text-slate-300"
                    >
                      {parsed}
                    </li>
                  );
                }

                return (
                  <p key={lineIdx} className="text-slate-300">
                    {parsed}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
};

export default MarkdownRenderer;
