import { twMerge } from "tailwind-merge";

function EyeIcon(props: {
  x?: number;
  y?: number;
  size: number;
  className?: string;
  fill?: string;
  style?: React.CSSProperties;
}) {
  return (
    <foreignObject
      width={props.size}
      height={props.size}
      style={props.style}
      className={props.className}
    >
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <mask id="eye-mask" maskUnits="userSpaceOnUse">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.00033 4.40625C10.219 4.40625 12.1664 5.65523 13.2106 7.52404C13.3747 7.81775 13.3747 8.18225 13.2106 8.47596C12.1669 10.3439 10.22 11.5938 8.00033 11.5938C5.78167 11.5938 3.83426 10.3448 2.79008 8.47596C2.62596 8.18225 2.62596 7.81773 2.79008 7.52402C3.83374 5.65613 5.7807 4.40625 8.00033 4.40625ZM8.00033 9.875C9.30945 9.875 10.3707 8.79068 10.3707 7.45312C10.3707 6.11557 9.30945 5.03125 8.00033 5.03125C6.69122 5.03125 5.62996 6.11557 5.62996 7.45312C5.62996 8.79068 6.69122 9.875 8.00033 9.875ZM12.7 8.15865C11.7381 9.88041 9.9608 10.9687 8.00033 10.9687C6.03198 10.9687 4.25846 9.87295 3.30063 8.15867C3.24595 8.06076 3.24595 7.93926 3.30063 7.84135C3.839 6.87781 4.6588 6.07504 5.6647 5.57793C5.27524 6.08967 5.03737 6.74156 5.03737 7.45312C5.03737 9.12926 6.35628 10.5 8.00033 10.5C9.64422 10.5 10.9633 9.12934 10.9633 7.45312C10.9633 6.74197 10.7256 6.08996 10.336 5.57793C11.3315 6.0699 12.1559 6.8674 12.7001 7.84135C12.7547 7.93926 12.7547 8.06075 12.7 8.15865ZM6.95459 6.78639C6.86565 6.9618 6.81515 7.16217 6.81515 7.375C6.81515 8.06535 7.34578 8.625 8.00033 8.625C8.65489 8.625 9.18552 8.06535 9.18552 7.375C9.18552 6.68465 8.65489 6.125 8.00033 6.125C7.79854 6.125 7.60856 6.17826 7.44224 6.27207H7.44261C7.71213 6.27207 7.93063 6.50252 7.93063 6.78678C7.93063 7.07104 7.71213 7.30148 7.44261 7.30148C7.17309 7.30148 6.95459 7.07104 6.95459 6.78678V6.78639Z"
            fill="white"
          />
        </mask>
        <g mask="url(#eye-mask)">
          <rect width="16" height="16" fill={props.fill} />
        </g>
      </svg>
    </foreignObject>
  );
}

type XAxis = "left" | "right" | "center";
type YAxis = "top" | "bottom" | "center";
type PositionKey = `${YAxis}-${XAxis}`;
type Position = { xm: number; ym: number };

const positions: Record<PositionKey, Position> = {
  "top-left": { xm: 0.2, ym: -1 },
  "top-center": { xm: 0, ym: -1 },
  "top-right": { xm: 0.2, ym: -1 },
  "center-right": { xm: 0.2, ym: 0 },
  "bottom-right": { xm: 0.2, ym: 1 },
  "bottom-center": { xm: 0, ym: 1 },
  "bottom-left": { xm: -0.2, ym: 1 },
  "center-left": { xm: -0.2, ym: 0 },
  "center-center": { xm: 0, ym: 0 },
};

type LabelProps = {
  r: number;
  text: string;
  position?: PositionKey | { xm: number; ym: number };
  className?: string;
  withIcon?: boolean;
  background?: string;
  color?: string;
  stroke?: string;
  rounded?: boolean;
};

export default function NodeLabel(props: LabelProps) {
  const {
    r,
    text: text,
    position = "bottom-center",
    withIcon = false,
    background = "white",
    color = "black",
    stroke = "black",
    rounded = false,
  } = props;
  const boxWidth =
    text
      .trim()
      .split("")
      .filter((x) => x !== " ").length *
      20 +
    (withIcon ? 60 : 0);
  const boxHeight = 60;

  const boxR = rounded ? 20 : 0;
  const eyeSize = 38;

  const { xm, ym } =
    typeof position === "string"
      ? positions[position as PositionKey]
      : position;

  const dx = xm < 0 ? boxWidth : xm === 0 ? boxWidth / 2 : 0;
  const boxX = r * xm - dx;
  const boxY = r * ym - boxHeight / 2;

  const tx = xm < 0 ? -boxWidth / 2 : xm === 0 ? 0 : boxWidth / 2;
  const textX = r * xm + tx + (withIcon ? eyeSize / 2 : 0);

  const boxTransform = `translate(${boxX}px, ${boxY}px)`;
  const iconTransform = `translate(${boxX + eyeSize / 2}px, ${
    boxY + boxHeight / 2 - eyeSize / 2
  }px)`;
  const textTransform = `translate(${textX}px, ${boxY + boxHeight / 2}px)`;

  return (
    <g
      className={twMerge("select-none *:transition-transform", props.className)}
    >
      <rect
        width={boxWidth}
        height={boxHeight}
        rx={boxR}
        fill={background}
        stroke={stroke}
        strokeWidth={3}
        style={{ transform: boxTransform }}
      ></rect>
      {withIcon && (
        <EyeIcon
          size={eyeSize}
          fill={color}
          style={{ transform: iconTransform }}
        />
      )}
      <text
        alignmentBaseline="middle"
        textAnchor="middle"
        className="font-mono text-2xl font-medium"
        style={{ transform: textTransform }}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}
