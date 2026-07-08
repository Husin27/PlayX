import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HintBox } from "../feedback/hint-box";
import type { PopupMenuConfig } from "../feedback/popup-menu";
import { Button } from "../general/button";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";

export interface HtmlMemoActionConfig {
  icon: LucideIcon;
  onClick: (htmlContent: string) => void;
  tooltipText?: string;
}

export interface HtmlMemoBoxProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  label?: string;
  error?: string;
  hint?: string;
  popupMenu?: PopupMenuConfig;
  defaultValue?: string;
  onChange?: (html: string) => void;
  actionIcons?: HtmlMemoActionConfig[];
  disabled?: boolean;
  required?: boolean;
}

export interface HtmlMemoBoxRef {
  getHtml: () => string;
  setHtml: (html: string) => void;
  focus: () => void;
}

export const HtmlMemoBox = forwardRef<HtmlMemoBoxRef, HtmlMemoBoxProps>(
  (
    {
      label,
      error,
      hint,
      popupMenu,
      defaultValue = "",
      onChange,
      actionIcons = [],
      disabled = false,
      className,
      required,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = Boolean(error);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
        }),
        UnderlineExtension,
      ],
      content: defaultValue,
      editable: !disabled,
      immediatelyRender: false,
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onFocus: () => setIsFocused(true),
      onBlur: () => setIsFocused(false),
      editorProps: {
        attributes: {
          class: cn(
            "prose prose-sm max-w-none focus:outline-none",
            "min-h-[120px] p-4",
            "text-text-main placeholder:text-muted-foreground/60",
            disabled && "opacity-50 pointer-events-none cursor-not-allowed",
            hasError && "border-destructive/50",
          ),
        },
      },
    });

    useImperativeHandle(ref, () => ({
      getHtml: () => editor?.getHTML() ?? "",
      setHtml: (html: string) => {
        editor?.commands.setContent(html);
        onChange?.(html);
      },
      focus: () => {
        editor?.commands.focus();
      },
    }));

    useEffect(() => {
      if (editor && defaultValue !== editor.getHTML()) {
        const { from, to } = editor.state.selection;
        editor.commands.setContent(defaultValue, {
          parseOptions: { preserveWhitespace: true },
        });
        editor.commands.setTextSelection({ from, to });
      }
    }, [defaultValue, editor]);

    const limitedActionIcons = actionIcons.slice(0, 4);

    const isActive = (mark: string) => editor?.isActive(mark) ?? false;
    const isActiveNode = (node: string) => editor?.isActive(node) ?? false;

    const toolbarButtons = [
      {
        icon: Bold,
        isActive: () => isActive("bold"),
        onClick: () => editor?.chain().focus().toggleBold().run(),
        tooltip: "Bold (Ctrl+B)",
      },
      {
        icon: Italic,
        isActive: () => isActive("italic"),
        onClick: () => editor?.chain().focus().toggleItalic().run(),
        tooltip: "Italic (Ctrl+I)",
      },
      {
        icon: UnderlineIcon,
        isActive: () => isActive("underline"),
        onClick: () => editor?.chain().focus().toggleUnderline().run(),
        tooltip: "Underline (Ctrl+U)",
      },
      {
        icon: List,
        isActive: () => isActiveNode("bulletList"),
        onClick: () => editor?.chain().focus().toggleBulletList().run(),
        tooltip: "Bullet List",
      },
    ];

    return (
      <div
        className={cn("w-full", className)}
        onContextMenu={(e) => popupMenu?.trigger(e)}
        {...props}
      >
        {hint && (
          <HintBox content={hint} className="mb-1.5">
            <span className="text-sm text-text-muted" />
          </HintBox>
        )}
        {label && (
          <label
            className={cn(
              "block text-sm font-medium text-text-main mb-1.5",
              disabled && "opacity-50",
            )}
          >
            {label}
            {required && (
              <span className="text-destructive ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <div
            className={cn(
              "flex items-center gap-1 p-2",
              "bg-card/90 backdrop-blur-[var(--backdrop-blur)]",
              "border-b border-[color-mix(in_oklch,var(--color-border)_60%,transparent)]",
              "rounded-t-surface",
              disabled && "opacity-50 pointer-events-none",
            )}
            role="toolbar"
            aria-label="Text formatting"
          >
            {toolbarButtons.map((btn, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "active:scale-95 transition-all duration-100",
                  btn.isActive() &&
                    "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                )}
                aria-label={btn.tooltip}
                aria-pressed={btn.isActive()}
                disabled={disabled || !editor}
                onClick={btn.onClick}
              >
                <btn.icon className="w-4 h-4" aria-hidden="true" />
              </Button>
            ))}
          </div>
          <div
            className={cn(
              "w-full bg-card/90 backdrop-blur-[var(--backdrop-blur)]",
              "border-[color-mix(in_oklch,var(--color-border)_60%,transparent)]",
              "rounded-b-surface",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
              "transition-all duration-200 ease-out",
              "min-h-[120px]",
              "outline-none",
              hasError &&
                "border-destructive/50 focus-visible:ring-destructive/50",
              disabled && "bg-muted/50",
              isFocused &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background",
            )}
            role="textbox"
            aria-multiline="true"
            aria-label={label}
            aria-invalid={hasError}
            aria-describedby={error ? "html-memo-error" : undefined}
          >
            {editor && <EditorContent editor={editor} />}
          </div>
          {limitedActionIcons.length > 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {limitedActionIcons.map((action, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="active:scale-95 transition-all duration-100"
                  aria-label={action.tooltipText}
                  disabled={disabled}
                  onClick={() => action.onClick(editor?.getHTML() ?? "")}
                >
                  <action.icon className="w-4 h-4" aria-hidden="true" />
                </Button>
              ))}
            </div>
          )}
        </div>
        {error && (
          <p
            id="html-memo-error"
            className={cn(
              "mt-1.5 text-sm",
              "text-destructive/90",
              "font-medium",
            )}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

HtmlMemoBox.displayName = "HtmlMemoBox";
