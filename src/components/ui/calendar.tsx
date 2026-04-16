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
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex w-full justify-around mb-2 relative",
        weekday:
          "text-muted-foreground rounded-md w-10 font-bold text-[0.8rem] uppercase text-center",
        week: "flex w-full justify-around mt-2 relative",
        day: cn(
          "p-0 relative text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([disabled])]:after:content-['Não_é_possível'] [&:has([disabled])]:after:hidden hover:[&:has([disabled])]:after:block",
          "[&:has([disabled])]:after:absolute [&:has([disabled])]:after:-top-8 [&:has([disabled])]:after:left-1/2 [&:has([disabled])]:after:-translate-x-1/2",
          "[&:has([disabled])]:after:bg-black [&:has([disabled])]:after:text-white [&:has([disabled])]:after:text-[10px] [&:has([disabled])]:after:px-2 [&:has([disabled])]:after:py-1",
          "[&:has([disabled])]:after:rounded-md [&:has([disabled])]:after:z-[100] [&:has([disabled])]:after:whitespace-nowrap",
          "[&:has([aria-disabled])]:after:content-['Não_é_possível'] [&:has([aria-disabled])]:after:hidden hover:[&:has([aria-disabled])]:after:block",
          "[&:has([aria-disabled])]:after:absolute [&:has([aria-disabled])]:after:-top-8 [&:has([aria-disabled])]:after:left-1/2 [&:has([aria-disabled])]:after:-translate-x-1/2",
          "[&:has([aria-disabled])]:after:bg-black [&:has([aria-disabled])]:after:text-white [&:has([aria-disabled])]:after:text-[10px] [&:has([aria-disabled])]:after:px-2 [&:has([aria-disabled])]:after:py-1",
          "[&:has([aria-disabled])]:after:rounded-md [&:has([aria-disabled])]:after:z-[100] [&:has([aria-disabled])]:after:whitespace-nowrap"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-medium rounded-full transition-all hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:hover:bg-transparent"
        ),
        range_end: "day-range-end",
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md font-bold shadow-primary/30",
        today: "text-primary bg-primary/5 border border-primary/30 font-bold",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent pointer-events-none",
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
