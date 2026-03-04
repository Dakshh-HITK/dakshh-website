import { HandCardProps } from "@/types/interface";

function HandCard({ children, className = "", ...props }: HandCardProps) {
    return (
        <div className={`hand-drawn-card ${className}`} {...props}>
            {children}
        </div>
    );
}

export default HandCard;