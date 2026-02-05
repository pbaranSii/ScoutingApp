import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onInput, value, defaultValue, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null)

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  const resize = React.useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = "auto"
    element.style.height = `${element.scrollHeight}px`
  }, [])

  React.useLayoutEffect(() => {
    resize(innerRef.current)
  }, [resize, value, defaultValue])

  const handleInput: React.FormEventHandler<HTMLTextAreaElement> = (event) => {
    resize(event.currentTarget)
    onInput?.(event)
  }

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={setRefs}
      onInput={handleInput}
      value={value}
      defaultValue={defaultValue}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
