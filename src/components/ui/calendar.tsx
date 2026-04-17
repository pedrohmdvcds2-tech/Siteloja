"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-card text-card-foreground rounded-2xl border border-primary/20 shadow-lg shadow-primary/5 font-sans", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center mb-4",
        caption_label: "text-base font-bold text-primary tracking-wide capitalize",
        nav: "space-x-1 flex items-center absolute inset-x-0 justify-between px-3 z-10",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent border-primary/20 hover:bg-primary/10 hover:border-primary text-primary/70 hover:text-primary transition-all p-0 shadow-sm rounded-full"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent border-primary/20 hover:bg-primary/10 hover:border-primary text-primary/70 hover:text-primary transition-all p-0 shadow-sm rounded-full"
        ),
        month_grid: "w-full border-collapse space-y-1 [&_tr>*:first-child]:hidden",
        weekdays: "flex w-full justify-around mb-2 relative",
        weekday: "text-muted-foreground rounded-md w-10 font-bold text-[0.8rem] uppercase text-center",
        week: "flex w-full justify-around mt-2 relative",
        day: "p-0 relative text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium rounded-full transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
        ),
        range_end: "day-range-end",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md font-bold shadow-primary/30",
        today: "text-primary bg-primary/5 border border-primary/30 font-bold",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-black bg-gray-200 opacity-90 font-bold cursor-not-allowed relative after:content-['Indisponível'] after:absolute after:-top-8 after:left-1/2 after:-translate-x-1/2 after:bg-black/90 after:text-white after:text-[11px] after:px-2 after:py-1 after:rounded-md after:z-50 after:whitespace-nowrap after:opacity-0 hover:after:opacity-100 after:transition-opacity",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === 'left') {
            return <ChevronLeft className="h-4 w-4" {...props}/>
          }
          return <ChevronRight className="h-4 w-4" {...props}/>
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
