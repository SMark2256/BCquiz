import { cva, VariantProps } from "class-variance-authority";


const dividerVariants = cva(
    "flex flex-1 items-center border-1 border-muted/30 bg-foreground/20 rounded-full ",
    {
        variants: {
            variant: {
                default: 'h-0.5',
                sm: 'h-1',
                md: 'h-1.5',
                lg: 'h-2.5',
                xl: 'h-3',
            }
        }

    })

interface DividerProps extends VariantProps<typeof dividerVariants> {
    variant?: "default" | "sm" | "md" | "lg" | "xl";
    text?: string;
}


function Divider({ variant = "default", text }: DividerProps) {
    return (
        <div className="mb-8 mt-4 flex items-center gap-3 sm:mb-10 sm:gap-4">
            <div className={dividerVariants({ variant })}/>
            {text && (
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted sm:text-sm">
                    {text}
                </h2>
            )}
            <div className={dividerVariants({ variant })}/>
        </div>
    )

}

export { Divider }
