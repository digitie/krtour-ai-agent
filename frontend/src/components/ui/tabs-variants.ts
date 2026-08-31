import { cva } from "class-variance-authority";

// TabsList의 두 variant가 공유하는 최신 기준 레포 recipe.
export const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center text-text-secondary group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch",
  {
    variants: {
      variant: {
        default:
          "h-control gap-0.5 rounded-control bg-surface-subtle p-0.5 group-data-vertical/tabs:h-fit",
        line: "h-control gap-4 rounded-none border-b border-border bg-transparent p-0 group-data-vertical/tabs:border-r group-data-vertical/tabs:border-b-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
